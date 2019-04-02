<?php

declare(strict_types=1);

namespace App\GraphQL\Resolver;

use App\Entity\Message;
use App\Entity\Room;
use App\Repository\MessageRepository;
use App\Repository\RoomRepository;
use Doctrine\Common\Persistence\ObjectManager;
use Overblog\GraphQLBundle\Error\UserError;
use Overblog\GraphQLBundle\Resolver\ResolverMap;
use Overblog\GraphQLSubscription\RootValue;
use Overblog\GraphQLSubscription\SubscriptionManager;

class SubscriptionResolverMap extends ResolverMap
{
    private $subscriptionManager;

    private $manager;

    public function __construct(SubscriptionManager $subscriptionManager, ObjectManager $manager)
    {
        $this->subscriptionManager = $subscriptionManager;
        $this->manager = $manager;
    }

    protected function map()
    {
        /** @var RoomRepository $roomRepository */
        $roomRepository = $this->manager->getRepository(Room::class);
        /** @var MessageRepository $roomRepository */
        $messageRepository = $this->manager->getRepository(Message::class);

        $roomById = function (int $id) use ($roomRepository): ?Room {
            return $roomRepository->findOneBy(['id' => $id], ['createdAt' => 'DESC']);
        };

        $formatCreatedAt = function($value): string {
            return $value->getCreatedAt()->format(\DATE_ATOM);
        };

        $findMessagesForRoom = function (int $roomId) use ($messageRepository): iterable {
            return $messageRepository->findBy(['room' => $roomId], ['createdAt' => 'DESC']);
        };

        return [
            'Query' => [
                'rooms' => function () use ($roomRepository) {
                    return $roomRepository->findBy([], ['createdAt' => 'DESC']);
                },
                'messages' => function ($value, $args) use ($roomById, $findMessagesForRoom) {
                    return  $findMessagesForRoom($args['roomId']);
                },
            ],
            'Mutation' => [
                'chat' => function ($value, $args) use ($roomById) {
                    $room = $roomById($args['roomId']);
                    if (null === $room) {
                        throw new UserError('Unknown room.');
                    }

                    $message = new Message();
                    $message->setRoom($room)
                        ->setNickname($args['nickname'])
                        ->setCreatedAt(new \DateTime())
                        ->setBody($args['body']);

                    $this->manager->persist($message);
                    $this->manager->flush();

                    // Then we can publish new messages that arrives from the chat mutation
                    $this->subscriptionManager->notify('inbox', $message); // <- Exactly what "inbox" will receive

                    return $message;
                },
                'createRoom' => function ($value, $args): Room {
                    $room = new Room();
                    $room->setName($args['name'])
                        ->setCreatedAt(new \DateTime());

                    $this->manager->persist($room);
                    $this->manager->flush();

                    return $room;
                },
            ],
            'Subscription' => [
                'inbox' => function (?RootValue $payloadEvent, $args) use ($roomById) {
                    if (null === $payloadEvent) {
                        // here send data on subscription start

                        return;
                    }
                    /** @var Message $message */
                    $message = $payloadEvent->getPayload();

                    // filter on roomName
                    if (isset($args['roomId'])) {
                        $room = $roomById($args['roomId']);
                        if ($room->getId() !== $message->getRoom()->getId()) {
                            $payloadEvent->stopPropagation();

                            return;
                        }
                    }

                    return $message;
                },
            ],
            'Message' => [
                'roomId' => function(Message $message): Int {
                    return $message->getRoom()->getId();
                },
                'createdAt' => $formatCreatedAt
            ],
            'Room' => [
                'createdAt' => $formatCreatedAt,
                'countMessages' => function(Room $room){
                    return $room->getMessages() ? count($room->getMessages()) : 0;
                },
            ]
        ];
    }
}

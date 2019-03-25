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
use Overblog\GraphQLBundle\Subscription\Event\PayloadEvent;
use Overblog\GraphQLBundle\Subscription\RealtimeNotifier;

class SubscriptionResolverMap extends ResolverMap
{
    private $realTimeNotifier;

    private $manager;

    public function __construct(RealtimeNotifier $realTimeNotifier, ObjectManager $manager)
    {
        $this->realTimeNotifier = $realTimeNotifier;
        $this->manager = $manager;
    }

    protected function map()
    {
        /** @var RoomRepository $roomRepository */
        $roomRepository = $this->manager->getRepository(Room::class);
        /** @var MessageRepository $messageRepository */
        $messageRepository = $this->manager->getRepository(Message::class);

        $roomByName = function (string $name) use ($roomRepository): ?Room {
            return $roomRepository->findOneBy(['name' => $name]);
        };
        $findMessagesForRoom = function (string $roomName) use ($roomByName): iterable {
            $room = $roomByName($roomName);
            return $room ? $room->getMessages() : [];
        };

        return [
            'Query' => [
                'rooms' => function () use ($roomRepository) {
                    return $roomRepository->findAll();
                },
                'messages' => function ($value, $args) use ($roomByName, $findMessagesForRoom) {
                    return  $findMessagesForRoom($args['roomName']);
                },
            ],
            'Mutation' => [
                'chat' => function ($value, $args) use ($roomByName) {
                    $room = $roomByName($args['roomName']);
                    if (null === $room) {
                        throw new UserError('Unknown room.');
                    }

                    $message = new Message();
                    $message->setRoom($room)
                        ->setCreatedAt(new \DateTime())
                        ->setBody($args['body']);

                    $this->manager->persist($message);
                    $this->manager->flush();

                    // Then we can publish new messages that arrives from the chat mutation
                    $this->realTimeNotifier->notify('inbox', $message); // <- Exactly what "inbox" will receive

                    return $message;
                },
                'createRoom' => function ($value, $args): Room {
                    $room = new Room();
                    $room->setName($args['name']);

                    $this->manager->persist($room);
                    $this->manager->flush();

                    return $room;
                },
            ],
            'Subscription' => [
                'inbox' => function (?PayloadEvent $payloadEvent, $args) use ($roomByName) {
                    if (null === $payloadEvent) {
                        // here send data on subscription start

                        return;
                    }
                    /** @var Message $message */
                    $message = $payloadEvent->getPayload();

                    // filter on roomName
                    if (isset($args['roomName'])) {
                        $room = $roomByName($args['roomName']);
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
                'createdAt' => function(Message $message): string {
                    return $message->getCreatedAt()->format(\DATE_ATOM);
                }
            ]
        ];
    }
}

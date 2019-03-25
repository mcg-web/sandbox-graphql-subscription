<?php

declare(strict_types=1);

namespace App\GraphQL\Resolver;

use Overblog\GraphQLBundle\Resolver\ResolverMap;
use Overblog\GraphQLBundle\Subscription\Event\PayloadEvent;
use Overblog\GraphQLBundle\Subscription\RealtimeNotifier;

class SubscriptionResolverMap extends ResolverMap
{
    private $realTimeNotifier;

    private $rooms = [
        'foo' => ['id' => 1, 'name' => 'foo', 'messages' => []],
        'bar' => ['id' => 2, 'name' => 'bar', 'messages' => []],
    ];

    public function __construct(RealtimeNotifier $realTimeNotifier)
    {
        $this->realTimeNotifier = $realTimeNotifier;
    }

    protected function map()
    {
        $roomByName = function ($name) {
            return $this->rooms[$name] ?? null;
        };

        $findMessagesForRoom = function ($room) {
            return $this->rooms[$room['name']]['messages'] ?? [];
        };

        $roomType = [
            'messages' => $findMessagesForRoom,
        ];

        $queryType = [
            'rooms' => function () {
                return $this->rooms;
            },
            'messages' => function ($value, $args) use ($roomByName, $findMessagesForRoom) {
                $roomName = $args['roomName'];
                $room = $roomByName($roomName);
                $messages = $findMessagesForRoom($room);

                return $messages;
            },
        ];

        $mutationType = [
            'chat' => function ($value, $args) use ($roomByName) {
                $roomName = $args['roomName'];
                $body = $args['body'];

                $room = $roomByName($roomName);

                $message = [];
                $message['roomId'] = $room['id'];
                $message['body'] = $body;
                $message['timestamp'] = (new \DateTime())->format(\DateTime::ATOM);

                $this->rooms[$roomName]['messages'][] = $message;

                // Then we can publish new messages that arrives from the chat mutation
                $this->realTimeNotifier->notify('inbox', $message); // <- Exactly what "inbox" will receive

                return $message;
            },
        ];

        $subscriptionType = [
            'inbox' => function (?PayloadEvent $payloadEvent, $args) use ($roomByName) {
                if (null === $payloadEvent) {
                    // here send data on subscription start

                    return;
                }
                $message = $payloadEvent->getPayload();

                // filter on roomName
                if (isset($args['roomName'])) {
                    $room = $roomByName($args['roomName']);
                    if ($room['id'] !== $message['roomId']) {
                        $payloadEvent->stopPropagation();

                        return;
                    }
                }

                return $message;
            },
        ];

        return [
            'Room' => $roomType,
            'Query' => $queryType,
            'Mutation' => $mutationType,
            'Subscription' => $subscriptionType,
        ];
    }
}

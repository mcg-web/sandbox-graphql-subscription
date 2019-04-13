<?php

require __DIR__ . '/../php/cors-preflight.php';
require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../php/send-response.php';

use App\GraphQL\Resolver\SubscriptionResolverMap;
use GraphQL\GraphQL;
use GraphQL\Utils\BuildSchema;
use Overblog\GraphQLSubscription\Builder;
use Overblog\GraphQLSubscription\MessageTypes;
use Overblog\GraphQLSubscription\Request\JsonParser;

$schema = BuildSchema::build(
    file_get_contents(__DIR__ . '/../config/graphql/types/Schema.graphql')
);
$subscriptionManager = (new Builder())
    ->setHubUrl('http://mercure:5000/hub')
    ->setTopicUrlPattern('http://localhost:8000/subscriptions/{channel}/{id}.json')
    ->setPublisherSecretKey('!mySuperPublisherSecretKey!')
    ->setSubscriberSecretKey('!mySuperSubscriberSecretKey!')
    ->setSchema($schema)
    ->setSubscribeStoragePath(__DIR__ . '/../var/graphql-subscriptions')
    ->getSubscriptionManager();

// field resolver
GraphQL::setDefaultFieldResolver(new SubscriptionResolverMap(
    $subscriptionManager,
    include __DIR__ . '/../php/doctrine-manager.php'
));

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

if (isset($input['type']) && in_array($input['type'], MessageTypes::CLIENT_MESSAGE_TYPES)) {
    // handle subscription start / stop
    [$type, $id, $payload] = (new JsonParser())($_SERVER['CONTENT_TYPE'], $rawInput);
    $data = $subscriptionManager->handle(compact('type', 'payload', 'id'));
} else {
    $query = $input['query'] ?? null;
    $variables = $input['variables'] ?? null;
    $operationName = $input['operationName'] ?? null;
    $data = GraphQL::executeQuery($schema, $query, null, null, $variables, $operationName);
}

sendResponse($data);
$subscriptionManager->processNotificationsSpool();

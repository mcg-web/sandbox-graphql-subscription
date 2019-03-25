FROM php:7.2-apache

RUN a2enmod rewrite
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

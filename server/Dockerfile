FROM php:7.2-apache

RUN apt-get update \
    && apt-get install -y --no-install-recommends git zip \
    && a2enmod rewrite \
    ########## optimize image weight ##########
    && apt-get clean autoclean \
    && apt-get autoremove -y \
    && apt-get purge \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

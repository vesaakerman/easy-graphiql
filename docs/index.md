MANUAL
======

[![Build Status](https://travis-ci.org/DANS-KNAW/easy-graphiql.svg?branch=master)](https://travis-ci.org/DANS-KNAW/easy-graphiql)

EASY GraphiQL UI


BUILDING FROM SOURCE
--------------------

**Prerequisites:**

* Maven 3.3.3 or higher
* NodeJS 8.9.4 or higher
* NPM 5.6.0 or higher

**Download the project:**

    git clone https://github.com/DANS-KNAW/easy-graphiql.git
    cd easy-graphiql
    [using NPM] npm install
    [using Maven] mvn install

**Running dev server:**

* `npm start`
* go to [http://localhost:3000] in your favorite browser

**Building for production:**

1. using NPM
    * `npm run build`
    * the output can be found in `./build`
2. using Maven
    * `mvn clean install`
    * the output can be found in `./build`
    * the RPM can be found in `./target/rpm`

UPDATE DEPENDENCIES
-------------------

    npm install -g npm-check-updates
    ncu -u
    npm install

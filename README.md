# wallet-api

> Equibit Wallet API

## About

This project uses [Feathers](http://feathersjs.com). An open source web framework for building modern real-time applications.

## Getting Started

Getting up and running is as easy as 1, 2, 3.

1. Make sure you have [NodeJS](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed.
2. Install your dependencies
    
    ```
    cd path/to/wallet-api; npm install
    ```
3. For local development remember to get `local-development-local.json` or correct bitcoin settings from one of the maintainers.
4. For local development you also need to have a running MongoDB instance on your local machine; you can run `docker-compose up` if you're working with Docker.
5. Start your app
    
    ```
    npm start
    ```

## Testing

Simply run `npm test` and all your tests in the `test/` directory will be run.

## Scaffolding

Feathers has a powerful command line interface. Here are a few things it can do:

```
$ npm install -g feathers-cli             # Install Feathers CLI

$ feathers generate service               # Generate a new Service
$ feathers generate hook                  # Generate a new Hook
$ feathers generate model                 # Generate a new Model
$ feathers help                           # Show all commands
```

## Developing

To run a local Bitcoin node in the regtest mode:

1. Download BitcoinCore from https://bitcoin.org/en/download
2. Run the core with params:
```
$ /Applications/Bitcoin-Qt.app/Contents/MacOS/Bitcoin-Qt \
  -logtimestamps \
  -server \
  -port=8338 \
  -debug \
  -regtest \
  -rpcuser=user \
  -rpcpassword=password \
  -rpcport=18332 \
  -rpcallowip=127.0.0.1
```

## Help

For more information on all the things you can do with Feathers visit [docs.feathersjs.com](http://docs.feathersjs.com).

## Changelog

__0.1.0__

- Initial release

## License

Copyright (c) 2016

Licensed under the [MIT license](LICENSE).

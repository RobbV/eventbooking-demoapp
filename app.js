// import application requirments
// packages for node server
const express = require('express');
const bodyParser = require('body-parser');
// packages for GraphQL API
const graphqlHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// import Models
const Event = require('./models/event');
const User = require('./models/user');

const app = express();

const events = [];


app.use(bodyParser.json());

app.use('/graphql', graphqlHttp({
    // schema Object
    schema: buildSchema(`

        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
        }
        type User {
            _id: ID!
            email: String!
            password: String
        }
        input EventData {
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        input UserData {
            email : String!
            password: String!
        }
        type RootQuery {
            events: [Event!]!
        }

        type RootMutation {
            createEvent(eventData: EventData): Event
            createUser(userData: UserData): User
        }
        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    // resolvers
    rootValue: {
        // Event Resolvers
       events: () => {
           return Event.find()
                .then(events => {
                    return events.map(event => {
                        // convert the ID assigned by mongo to a string so it can be understood by GraphQL
                        return { ...event._doc, _id: event._doc._id.toString() };
                    });
                })
                .catch( err => {
                    throw err;
                });
        }, 
        createEvent: args => {
            const event = new Event({
                title: args.eventData.title,
                description: args.eventData.description,
                price: args.eventData.price,
                date: new Date(args.eventData.date),
                creator: '5c19b29b2340cf188bed0714'
            });
            // empty variable to store the created event object
            let createEvent;

            return event
            .save()
            .then(result => {
                createdEvent = {...result._doc, _id: result.id} 
               return User.findById('5c19b29b2340cf188bed0714') 
            })
            .then(user => {
                if (!user) {
                    throw new Error('there is no user found')
                }
                user.createdEvents.push(event);
                return user.save();
            }).then(result => {
                return createdEvent;
            })
            .catch(err => {
                console.log(err);
                throw err;
            });
        }, 
        //=======================End of Event Resolver==================================
        //User Resolver
        createUser: args => {
            // check the DB for email
            return User.findOne({ email: args.userData.email }).then(user => {
                // if email is found in the DB then throw an error to prevent duplicate email addresses
                if (user) {
                    throw new Error('User already exists!')
                }
                // encrypt the users password using bcrypt
                return bcrypt
                .hash(args.userData.password, 12)
            })
            .then(hashedPassword => {
                    const user = new User({
                        email: args.userData.email,
                        password: hashedPassword
                    });
                    return user.save();
                })
                .then(result => {
                    return { ...result._doc, password: null, _id: result.id}
                })
                .catch(err => {
                    throw err;
                })
        }
        //=======================End of User  Resolver==================================
    },
    graphiql: true
}));

mongoose
    .connect(
        `mongodb+srv://Robbert:sWs7QPtuRyonUsdJ@cluster0-fyfjh.mongodb.net/event-react-dev?retryWrites=true`
    ).then(() => {
        app.listen(3000);
    }).catch(err => {
        console.log(err);
    });


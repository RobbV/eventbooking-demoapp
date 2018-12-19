// import application requirments
// packages for node server
const express = require('express');
const bodyParser = require('body-parser');
// packages for GraphQL API
const graphqlHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');

// import event model
const Event = require('./models/event')

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

        input EventData {
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        type RootQuery {
            events: [Event!]!
        }

        type RootMutation {
            createEvent(eventData: EventData): Event
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    // resolvers
    rootValue: {
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
                date: new Date(args.eventData.date)
            });
            return event
            .save()
            .then(result => {
                console.log(result);
                return {
                    // can also us mongoose to turn the mongo ID to string
                    ...result._doc, _id: event.id
                }
            }).catch(err => {
                console.log(err);
                throw err;
            });
        }
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


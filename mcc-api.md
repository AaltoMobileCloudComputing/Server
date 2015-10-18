# Collections

Fields marked with * are mandatory (i.e. they need to be specified when creating resource). IDs (`_id`) are created by Mongo and included in response when resource is created. Supported date formats are same as what Javascript Date.parse() supports (e.g. `2015-11-12T13:14:15`). Also start time must be on or before end time.

## Events
    _id : ObjectID
    calendar : ObjectID *
    title : String *
    description : String
    start: ISODate *
    end: ISODate *

## Calendars
    _id : ObjectID
    title : String *
    description : String

## Users
    _id : ObjectID
    calendars : ObjectID[]
    username : String *
    firstname : String *
    lastname : String *
    email : String *
    password : String *
    token : String


# API
API URLs are:

    /user
    /event
    /calendar
    /calendar/share

Responses have always content type application/json. Typically the response is the requested document or an array of documents or, when creating or updating documents, the created/updated document (i.e. response reflects what was inserted into DB). If an error occurs the response is a JSON object with single field called `error`, e.g.:

    {
        "error": "Username already in use"
    }

Most requests require an user account which is verified with an API token. The token can be obtained by creating a user account (POST to `/user`) and it is supplied with query parameter `token`.

## GET
GETting a collection returns an array of documents (e.g. `GET /event` returns an array of events). By default 10 documents are returned, query parameters `limit` and `offset` can be used for pagination. Events can be also searched with more specific query parameters. Supported parameters are `start` and `end` for getting events between certain times and `search` for searching events by title.

If object ID is included in URL (e.g. `GET /event/123edf`) then only that specific document is returned.


## POST
POSTing to a collection creates a new document of that type. All required fields specified in the section above or otherwise an error is returned. If document was created successfully then that same document is returned with `_id` added.

Updating documents is done by POSTing to a specific document URL. When updating only the fields that are present in the request are updated i.e. request below would only update event tile.

    POST /event/123edf
    {
        "title": "Updated event title"
    }

Sharing calendars is done by POSTing to `/calendar/share` a request with following format:

    {
        "id": "<calendar-id-to-share",
        "userid": "<id-of-user-to-share-with>"
    }

## DELETE
Deleting a document simply deletes the object. Collections can't be deleted.

## Event
eventID : (Globally unique) String
calendarID : String
Title : String
Description : String
Start time : String (ISODate)
End time : String (ISODate)

## Calendar
calendarID : String
userID[] : StringArray

## User
userID : String
Username : String
Email : String
Password : String
Token : String

## Methods
1. POST
2. GET
3. DELETE

## Get list or create resource
/user
/event?date=20150924
/calendar?limit=10

## Get detailed info or update resource
/user/<id>
/event/<id>
/calendar/<id>?limit=10&offset=0

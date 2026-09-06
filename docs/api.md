# API Documentation

## Authentication

### POST /api/v1/auth/register

Registers a participant account.

Required body fields:
- fullName
- email
- password

### POST /api/v1/auth/login

Logs in an existing user and returns a JWT token.

Required body fields:
- email
- password

### POST /api/v1/auth/refresh

Refreshes the current authenticated session token.

### POST /api/v1/auth/logout

Logs the current user out of the session.

## Registration

### POST /api/v1/registrations

Content-Type: multipart/form-data

Required fields:
- fullName
- email
- mobileNumber
- role
- instituteName
- department
- knowsPython
- aicteQuantumCourse
- knowsQuantumBasics
- usedQiskitBefore
- idCard

Allowed role values:
- STUDENT
- FACULTY
- PROFESSIONAL
- OTHER

Successful response:
```json
{
  "success": true,
  "data": {
    "registrationId": "QFF26-R-00001",
    "status": "CONFIRMED"
  }
}
```

Duplicate email error:
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_ALREADY_REGISTERED",
    "message": "This email is already registered."
  }
}
```

## Event APIs

### GET /api/v1/events
Public read operation.

### GET /api/v1/events/:eventId
Public read operation.

### POST /api/v1/events
Admin-only.

### PUT /api/v1/events/:eventId
Admin-only.

### DELETE /api/v1/events/:eventId
Admin-only.

## Event Day APIs

### GET /api/v1/events/:eventId/days
Public read operation.

### GET /api/v1/events/:eventId/days/:dayId
Public read operation.

### POST /api/v1/events/:eventId/days
Admin-only.

### PUT /api/v1/events/:eventId/days/:dayId
Admin-only.

### DELETE /api/v1/events/:eventId/days/:dayId
Admin-only.

## Schedule APIs

### GET /api/v1/events/:eventId/days/:dayId/schedule
Public read operation.

### POST /api/v1/events/:eventId/days/:dayId/schedule
Admin-only.

### PUT /api/v1/schedule/:scheduleId
Admin-only.

### DELETE /api/v1/schedule/:scheduleId
Admin-only.

## Participant APIs

### GET /api/v1/participants/:participantId
Authenticated user or admin.

### PUT /api/v1/participants/:participantId
Authenticated user or admin.

## Admin APIs

### GET /api/v1/admin/registrations
Admin-only.

### GET /api/v1/admin/participants
Admin-only.

### GET /api/v1/admin/email-logs
Admin-only.

## Health

### GET /api/v1/health
Public endpoint.

Response:
```json
{
  "success": true,
  "status": "healthy",
  "service": "qiskit-fall-fest-backend"
}
```

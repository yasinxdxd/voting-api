# Vote API

This is the documentation for the Vote API, which includes endpoints for user authentication, voting, profile management, and admin functionalities. The API allows users to sign up, sign in, vote in elections, and manage elections and candidates.

## API Collection Overview

The collection contains the following main categories:

- **Authentication**
  - Sign up (`/auth/signup`)
  - Sign in (`/auth/signin`)
  
- **Voting**
  - Register for elections (`/vote/register`)
  - View elections (`/vote/elections`)
  - View vote status (`/vote/status`)
  - View all votes (`/vote/AllVotes`)
  
- **Profile Management**
  - User profile (`/profile/user`)
  
- **Admin Management**
  - Admin sign in (`/admin/signin`)
  - Create elections (`/admin/create/elections`)
  - Create candidates (`/admin/create/candidate`)
  - Create party (`/admin/create/party`)

---

## API Endpoints

### 1. **Authentication**

#### `POST /auth/signup`
- **Description**: Register a new user.
- **Headers**: 
  - `x-api-key`: `voteQQTSS2vTDqFAT7D2ZvK6WYpPtIJUdMQfSkO8`
- **Body**:
```json
{
    "tc_no": "79534231245",
    "first_name": "TestUser",
    "last_name": "TestLastName",
    "password": "ass123",
    "birthdate": "2002-08-07",
    "gender": "M"
}
```
#### `POST /auth/signin`
- **Description**: Register a new user.
- **Headers**: 
  - `x-api-key`: `voteQQTSS2vTDqFAT7D2ZvK6WYpPtIJUdMQfSkO8`
- **Body**:
```json
{
    "tc_no": "79534231245",
    "password": "ass123",
}
```

### 2. **Voting**
#### `POST /vote/register`
- **Description**: Register to vote in a specific election.
- **Headers**:
    - `x-api-key`: `voteQQTSS2vTDqFAT7D2ZvK6WYpPtIJUdMQfSkO8`
- **Body**:
```json
{
    "electionId": 3
}
```
#### `GET /vote/elections`
- **Description**: Retrieve all available elections.
- **Headers**:
    - `x-api-key`: `voteQQTSS2vTDqFAT7D2ZvK6WYpPtIJUdMQfSkO8`
#### `GET /vote/status`
- **Description**: Check the voting status.
- **Headers**:
    - `x-api-key`: `voteQQTSS2vTDqFAT7D2ZvK6WYpPtIJUdMQfSkO8`
#### `GET /vote/AllVotes`
- **Description**: Get a list of all votes.
- **Headers**:
    - `x-api-key`: `voteQQTSS2vTDqFAT7D2ZvK6WYpPtIJUdMQfSkO8`


### 3. **Profile Management**


### 4. **Admin Management**

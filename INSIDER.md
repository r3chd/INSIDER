# OUR PROJECT YIPPE YIPPE YIPPE

## 1. Overview
This is documentation that describes the implementation of **Insider**, an Among Us like game. It outlines the requirements, the game, blah blah blah.

## 2. Game Components
- Word Database (Theme Cards)
- Role Cards
- Timer
- Instructions

## 3. Game Requirements

### 3.1 Players
- 3 - 8 Players
### 3.3 Communication (PICK ONE OF THE FOLLOWING FOR NOW!!!)
- Text-based chat for Q&A and discussion
- Voice Chat
### 3.4 
- Server enforces role secrecy
- Server controls timers and transition between phases

## 4. Setup
### 4.1 Room Creation
- Host creates a room
- Host sets number of players
- System selects role cards equal to number of players
	- Required: **Master**, **Insider**
	- Optional: **Follower**
	- Remaining roles are **Common** roles
### 4.2 Role Distribution
- Server randomly assign roles to players
- UI:
	- **Master** role is revealed publicly in the room
	- All other roles remain hidden

## 5. Entities

### 5.1 Player
- A **Player** should always receive a role card describing their role during **Role Determination**.
- All players are allowed to vote who they believe the **Insider** is.
- There are two possible teams, **Common** and **Insider** team.
- By default, players are in the **Common Team**.
- A **Players** role is hidden from all players by default.
- By default, the word is hidden from all **Players**.

### 5.2 Role Cards
- Role cards determine a **Players** role during a **Game**.

#### 5.2.1 Role: Master
- The **Player** who receives the **Master** role is revealed to all players during **Role Distribution**.
- The **Master** cannot ask questions during **Q&A**.
- The **Master** cannot be voted for during **Voting**.
- The **Master** is shown the word during **Determination**.
- During **Determination**, the **Master** is asked questions by all players where they can only respond with the following responses:
	- 'Yes'
	- 'No'
	- 'I don't know'

#### 5.2.2 Role: Insider
- The **Player** who receives the **Insider** role knows the word.
- The **Insider** joins the **Insider Team**
- The word is shown during **Determination**.
- The **Insider**'s goal is to guide all **Players** towards the word during **Q&A** before the **Timer** runs out without being voted out during **Voting**.

#### 5.2.3 Role: Follower
- The **Follower** role is an optional role to be added into the game that contains 4+ **Players**.
- The **Follower** joins the **Insider Team**
- The **Follower** knows who the **Insider** is.
- The **Follower** is shown who the **Insider** is during **Determination** and can continue to see who the **Insider** is throughout the game.
- The **Follower**'s goal is to ensure that the **Insider** doesn't get voted out.

#### 5.2.4 Role: Commoner
- Every other **Player** receives the **Commoner** role
- The **Commoner** can only ask questions to the **Master**

### 5.3 Timer
- A **Timer** for **Q&A** by default is 3 minutes
- A **Timer** for **Discussion** by default is 2 minutes
- The amount of minutes on a timer can be changed.

## 6. Game Flow
- The **Game** must have at least 3 **Players** to play
- The **Game** should always contain a **Master** and an **Insider**

### Phase 1: Role Distribution & Determination
- Each **Player** in the **Game** receives a role card.
- **Master** is revealed.
- (OPTIONAL) **Master** selects 1 of 5 possible words.
- **Master** and **Insider** are given the word.

### Phase 2: Q&A
- System begins the Q&A timer
- System allocates playing order
- At a **Players** turn, they can ask a question to the **Master**.
- The word must be guessed before the **Timer** runs out.
- The **Player** who guesses the word correctly is marked as the **Guesser** and **Q&A** transitions to **Discussion**.
- If the **Timer** runs and the word hasn't been guessed, all players and **Q&A** transitions to **End**.

### Phase 3: Discussion & Voting

#### Judge Guesser (OPTIONAL)
- The first part is to discuss whether or not the **Guesser** is the **Insider**
- If the majority vote YES, then
	- If the **Guesser** is the **Insider**, **Insider Team** loses.
	- Else if the **Guesser** is not the **Insider**, **Insider Team** wins.
- If the majority vote is not YES, then proceed to **Final Judgement**.

#### Final Judgement
- **Players** discuss who they believe the **Insider** is.
- **Players** are able to vote for any other **Player**.
- **Players** must vote before the **Timer** expires.
- If votes are a tie:
	- If the **Guesser** is not included in the tie breaker
		- The **Guesser** decides the final vote
	- Else if the **Guesser** is included in the tie breaker
		- The **Master** decides the final vote
- If a **Player** has majority votes:
	- If voted **Player** is **Insider**, **Insider Team** loses.
	- Else if voted **Player** is not **Insider**, **Insider Team** wins.
- If the **Timer** expires:
	- If there are no votes, **Insider Team** wins.
	- If there are votes, the **Player** with majority is voted out.

## 7. UI/UX Requirements

## 8. Data & Randomisation

## 9. Security Considerations

## 10. Future Considerations

## Stack

### Front End:
- **JavaScript**
- **HTML**
- **React**

### Back End: 
- **Node.js**

### Real Time:
- **WebSockets**
- **Socket.io**
### Server Hosting: 
- **AWS**

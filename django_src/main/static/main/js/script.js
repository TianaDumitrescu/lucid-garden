const createAlarmBtn = document.getElementById("createAlarmBtn");
const closeBtn = document.getElementById("closeModal");
const alarmCreation = document.getElementById("alarmCreation");

// Open popup
createAlarmBtn.addEventListener("click", () => {
    alarmCreation.style.display = "flex";
});

// Close popup
closeBtn.addEventListener("click", () => {
    alarmCreation.style.display = "none";
});

const gameMessage = document.getElementById("game-message");
const starterSection = document.getElementById("starter-section");
const partySection = document.getElementById("party-section");
const collectionSection = document.getElementById("collection-section");
const battleSection = document.getElementById("battle-section");
const levelupSection = document.getElementById("levelup-section");

const nextButton = document.getElementById("next-button");
const partyButton = document.getElementById("party-button");
const collectionButton = document.getElementById("collection-button");

let selectedParty = [];

// Helper function to get CSRF token from cookies, which is needed for POST requests to the Django backend
function getCookie() {
    const name = "csrftoken";
    const cookies = document.cookie.split(";"); // splits the cookie string into an array of individual cookies

    // Iterates through the cookies to find the one with the specified name and returns its value    
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(name + "=")) {
            return cookie.substring(name.length + 1);
        }
    }
    return "";
}

function showGameMessage(message) {
    gameMessage.textContent = message;
}

function clearGameMessage() {
    gameMessage.textContent = "";
}

function clearSections() {
    starterSection.innerHTML = "";
    partySection.innerHTML = "";
    collectionSection.innerHTML = "";
    battleSection.innerHTML = "";
    levelupSection.innerHTML = "";
    nextButton.style.display = "none";
    partyButton.style.display = "none";
    collectionButton.style.display = "none";

    partyButton.textContent = "Show Party";
    collectionButton.textContent = "Show Collection";
}

function mainHub() {
    clearSections();
    clearGameMessage();
    partyButton.style.display = "inline-block";
    collectionButton.style.display = "inline-block";
}


function getLucidImage(speciesId) {
    return `/static/main/images/lucids/${speciesId}.png`;
}

/*====================================*/
/*== CHOOSING STARTER FUNCTIONALITY ==*/
/*====================================*/

async function loadStarterData() {
    clearSections();
    clearGameMessage();
    try {
        const response = await fetch("/game/starter/"); // makes a GET request to the backend to retrieve starter data from the game app
        const data = await response.json(); // converts that data received from the backend into a JavaScript object

        // If the player has already chosen a starter, then go straight to the main hub of the game
        if (data.starter_chosen) {
            mainHub();
        } else {
            showStarterOptions(data.options); // if player hasn't chosen a starter, calls this function that shows starters to user's screen
        }

    } catch (error) {
        showGameMessage("Could not load data, please reload page");
        console.log(error);
    }
}

function showStarterOptions(options) {
    let html = "<h4>Choose Your Starter</h4>";

    // Loops through the options through the fetch to the backend and creates a div for each starter with its name, type, description, and a button to choose it
    for (let i = 0; i < options.length; i++) {
        const lucid = options[i];
        html += `
            <div style="border:1px solid white; padding:10px; margin-bottom:10px;">
                <img src="${getLucidImage(lucid.species_id)}" alt="${lucid.name}" width="100">
                <p><strong>${lucid.name}</strong></p>
                <p>Type: ${lucid.type.join(", ")}</p>
                <p>${lucid.description}</p>
                <button onclick="chooseStarter(${lucid.id})">Choose</button>
            </div>
        `;
    }

    starterSection.innerHTML = html;
}

// Fires off when user clicks the "Choose" button for a starter
async function chooseStarter(speciesId) {
    try {
        // Different then the GET fetch to the backend, this is a POST request that sends 
        // the speciesId of the starter the user chose to the backend so it can be saved in the database
        const response = await fetch("/game/starter/choose/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie() // Have to have a csrftoken for POST requests to django backend
            },
            body: JSON.stringify({
                species_id: speciesId
            })
        });

        const data = await response.json();

        // If the response from the backend is not ok, it means there was an error with choosing the starter, so we show an error message to the user
        if (!response.ok) {
            showGameMessage("Could not choose starter.");
            return;
        }

        starterSection.innerHTML = ""; // Clears the starter options from the screen after user chooses a starter
        showGameMessage(`Starter chosen successfully, you chose ${data.starter.name}!!!!`);
        nextButton.style.display = "inline-block"; // Shows the "Next" button that allows user to continue to the main hub of the game after choosing a starter
    } 
    // If there's an error with the fetch request to the backend
    catch (error) {
        showGameMessage("Something went wrong while choosing starter, please reload page");
        console.log(error);
    }
}

/*============================================*/
/*== SHOWING PARTY/COLLECTION FUNCTIONALITY ==*/
/*============================================*/

// Loaded on the mainHub(), this function is responsible for loading the user's party data from the backend and displaying it on the screen, 
// as well as allowing the user to show/hide their party and collection
async function loadParty() {
    try {
        // Gets the user's party data from the backend with using a GET request
        const response = await fetch("/game/party/");
        const data = await response.json();

        // Gives the current party of the user from the backend and set it in the frontend
        setSelectedPartyFromCurrentParty(data.party); 

        if (partyButton.textContent === "Show Party") {
            showParty(data.party);
            partyButton.textContent = "Hide Party";
        } else {
            partySection.innerHTML = "";
            partyButton.textContent = "Show Party";
        }
    } catch (error) {
        showGameMessage("Could not load party.");
        console.log(error);
    }
}

// Very similar functionality to loadParty(), but instead for the user's overall lucid collection
async function loadCollection() {
    try {
        const response = await fetch("/game/collection/");
        const data = await response.json();

        if (collectionButton.textContent === "Show Collection") {
            showCollection(data.collection);
            collectionButton.textContent = "Hide Collection";
        } else {
            collectionSection.innerHTML = "";
            collectionButton.textContent = "Show Collection";
        }
    } catch (error) {
        showGameMessage("Could not load collection.");
        console.log(error);
    }
}

// Called by loadParty(), allows user to see the data from the backend about their party
function showParty(party) {
    let html = "<h4>Your Party</h4>";

    // Should never happen that party is null because we create a party for the user when they register,
    // but just in case we check if it's empty and show a message to the user if they don't have any Lucids in their party yet
    if (party.length === 0) {
        html += "<p>You do not have any Lucids in your party yet.</p>";
        partySection.innerHTML = html;
        return;
    }

    // Loops through each lucid in the user's party
    for (let i = 0; i < party.length; i++) {
        const lucid = party[i];

        html += `
            <div style="border:1px solid white; padding:10px; margin-bottom:10px;">
                <img src="${getLucidImage(lucid.species_id)}" alt="${lucid.name}" width="100">
                <p><strong>${lucid.name}</strong></p>
                <p>Level: ${lucid.level}</p>
                <p>Types: ${lucid.types.join(", ")}</p>
                <p>HP: ${lucid.current_hp}/${lucid.stats.hp}</p>
                <p>Attack: ${lucid.stats.attack}</p>
                <p>Speed: ${lucid.stats.speed}</p>
                <p>Party Slot: ${lucid.party_slot}</p>
                <button onclick="removeFromParty(${lucid.owned_id})">Remove from Party</button>
            </div>
        `;
    }

    partySection.innerHTML = html;
}

// Very similar to showParty(), but instead for showing the user's overall collection of Lucids instead of just the ones in their party
function showCollection(collection) {
    let html = "<h4>Your Collection</h4>";

    // Should also never happen, but just incase
    if (collection.length === 0) {
        html += "<p>You do not own any Lucids yet.</p>";
        collectionSection.innerHTML = html;
        return;
    }

    for (let i = 0; i < collection.length; i++) {
        const lucid = collection[i];
        const alreadyInParty = selectedParty.includes(lucid.owned_id);

        html += `
            <div style="border:1px solid white; padding:10px; margin-bottom:10px;">
                <img src="${getLucidImage(lucid.species_id)}" alt="${lucid.name}" width="100">
                <p><strong>${lucid.name}</strong></p>
                <p>Level: ${lucid.level}</p>
                <p>Types: ${lucid.types.join(", ")}</p>
                <p>HP: ${lucid.current_hp}/${lucid.stats.hp}</p>
                <p>Attack: ${lucid.stats.attack}</p>
                <p>Speed: ${lucid.stats.speed}</p>
                <button onclick="addToParty(${lucid.owned_id})" ${alreadyInParty ? "disabled" : ""}>
                    ${alreadyInParty ? "Already in Party" : "Add to Party"}
                </button>
            </div>
        `;
    }

    collectionSection.innerHTML = html;
}

/*=================================*/
/*== EDITING PARTY FUNCTIONALITY ==*/
/*=================================*/

// Puts the user's party data from the backend into this selectParty variable in the frontend, so we can easily manipulate it in UI
function setSelectedPartyFromCurrentParty(party) {
    selectedParty = [];

    for (let i = 0; i < party.length; i++) {
        selectedParty.push(party[i].owned_id);
    }
}

// Called when the user clicks the "Add to Party" button on a specific lucid in their collection
function addToParty(ownedId) {
    // Checks if that lucid is already in the user's party
    if (selectedParty.includes(ownedId)) {
        showGameMessage("That Lucid is already in your party.");
        return;
    }

    // Party can't be greater than 3
    if (selectedParty.length >= 3) {
        showGameMessage("Your party can only have 3 Lucids.");
        return;
    }

    // If the lucid isn't already in the party and party isn't full, then we add it to the selectedParty variable in the frontend and call saveParty() to update the backend with the new party data
    selectedParty.push(ownedId);
    saveParty();
}

// Called when the user clicks the "Remove from Party" button on a specific lucid in their party
function removeFromParty(ownedId) {
    // We filter out that lucid from the selectedParty variable in the frontend and then call saveParty() to update the backend with the new party data
    selectedParty = selectedParty.filter(id => id !== ownedId);
    saveParty();
}

// This function is responsible for sending the updated party data from the frontend to the backend to be saved in the database
async function saveParty() {
    try {
        // Uses a POST request to send the selectedParty data from the frontend to the backend
        const response = await fetch("/game/party/set/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie()
            },
            body: JSON.stringify({
                owned_lucid_ids: selectedParty
            })
        });

        const data = await response.json();

        // If the response from the backend is not ok, it means there was an error with saving the party, so we show an error message to the user
        if (!response.ok) {
            showGameMessage(data.error || "Could not save party.");
            return;
        }

        // Updates the party shown on the frontend as well
        showGameMessage("Party updated successfully.");
        showParty(data.party);
        partyButton.textContent = "Hide Party";
        loadCollection();
    } catch (error) {
        showGameMessage("Something went wrong while saving party.");
        console.log(error);
    }
}

/*============================*/
/*== LEVEL UP FUNCTIONALITY ==*/
/*============================*/

// This function is responsible for showing the level up options to the user for any Lucids in their party that have pending level ups, 
// and allowing the user to choose which stat they want to increase for each level up
function showLevelUpOptions(party) {
    let html = "<h4>Level Up Your Lucids</h4>";

    let hasPendingLevelups = false;

    for (let i = 0; i < party.length; i++) {
        const lucid = party[i];

        if (lucid.pending_levelups > 0) {
            hasPendingLevelups = true;

            html += `
                <div style="border:1px solid white; padding:10px; margin-bottom:10px;">
                    <img src="${getLucidImage(lucid.species_id)}" alt="${lucid.name}" width="100">
                    <p><strong>${lucid.name}</strong></p>
                    <p>Level: ${lucid.level}</p>
                    <p>Pending Level Ups: ${lucid.pending_levelups}</p>
                    <button onclick="applyLevelChoice(${lucid.owned_id}, 'hp')">Increase HP</button>
                    <button onclick="applyLevelChoice(${lucid.owned_id}, 'attack')">Increase Attack</button>
                    <button onclick="applyLevelChoice(${lucid.owned_id}, 'speed')">Increase Speed</button>
                </div>
            `;
        }
    }

    if (!hasPendingLevelups) {
        levelupSection.innerHTML = "";
        return;
    }

    levelupSection.innerHTML = html;
}

// Called when the user clicks on of the "Increase HP/Attack/Speed" buttons for a lucid that has pending level ups, this function sends the user's choice for which stat to increase to the backend to update the lucid's stats in the database
async function applyLevelChoice(ownedLucidId, statChoice) {
    try {
        // Uses a POST request to send the user's choice for which stat to increase
        const response = await fetch("/game/level-up/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie()
            },
            body: JSON.stringify({
                owned_lucid_id: ownedLucidId,
                stat_choice: statChoice
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showGameMessage(data.error || "Could not apply level up.");
            return;
        }

        showGameMessage(`${data.lucid.name} leveled up.`);
        loadParty();
        loadCollection();
    } catch (error) {
        showGameMessage("Something went wrong while leveling up.");
        console.log(error);
    }
}

loadStarterData();
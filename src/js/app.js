// Import Web3 and contract library
const Web3 = require('web3');
const contract = require('@truffle/contract');

// Import Voting contract artifact
const votingArtifacts = require('../../build/contracts/Voting.json');
const VotingContract = contract(votingArtifacts);

// Initialize Web3 and set contract provider and defaults
const initializeWeb3 = async () => {
  try {
    if (typeof window.ethereum !== "undefined") {
      console.warn("Using web3 detected from external source like Metamask");
      window.eth = new Web3(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    } else {
      console.warn("No web3 detected. Falling back to http://localhost:9545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for deployment. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
      window.eth = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"));
    }
    VotingContract.setProvider(window.eth.currentProvider);
    VotingContract.defaults({ from: window.eth.accounts[0], gas: 6654755 });
  } catch (error) {
    console.error("Error initializing Web3 and contract provider:", error.message);
  }
};

// Load account data
const loadAccountData = () => {
  $("#accountAddress").html("Your Account: " + window.eth.accounts[0]);
};

// Event handlers
const addCandidateEvent = () => {
  $('#addCandidate').click(() => {
    console.log('Add candidate button clicked');
    const nameCandidate = $('#name').val();
    const partyCandidate = $('#party').val();
    VotingContract.deployed().then((instance) => {
      console.log('Contract instance obtained');
      instance.addCandidate(nameCandidate, partyCandidate).then((result) => {
        console.log('Candidate added', result);
      }).catch((err) => {
        console.error('Error adding candidate:', err.message);
      });
    }).catch((err) => {
      console.error('Error deploying contract:', err.message);
    });
  });
};

const addDateEvent = () => {
  $('#addDate').click(() => {
    const startDate = Date.parse($("#startDate").val()) / 1000;
    const endDate = Date.parse($("#endDate").val()) / 1000;
    VotingContract.deployed().then((instance) => {
      instance.setDates(startDate, endDate).then(() => {
        console.log("Dates set successfully");
      }).catch((err) => {
        console.error("Error setting dates:", err.message);
      });
    });
  });
};

const displayDates = () => {
  VotingContract.deployed().then((instance) => {
    instance.getDates().then((result) => {
      const startDate = new Date(result[0] * 1000);
      const endDate = new Date(result[1] * 1000);
      $("#dates").text(startDate.toDateString() + " - " + endDate.toDateString());
    }).catch((err) => {
      console.error("Error fetching dates:", err.message);
    });
  });
};

const displayCandidates = (countCandidates) => {
  for (let i = 0; i < countCandidates; i++) {
    VotingContract.deployed().then((instance) => {
      instance.getCandidate(i + 1).then((data) => {
        const id = data[0];
        const name = data[1];
        const party = data[2];
        const voteCount = data[3];
        const viewCandidates = `<tr><td><input class="form-check-input" type="radio" name="candidate" value="${id}" id=${id}>${name}</td><td>${party}</td><td>${voteCount}</td></tr>`;
        $("#boxCandidate").append(viewCandidates);
      });
    });
  }
};

const checkVoteAndEnableButton = () => {
  VotingContract.deployed().then((instance) => {
    instance.checkVote().then((voted) => {
      console.log(voted);
      if (!voted) {
        $("#voteButton").prop("disabled", false);
      }
    });
  });
};

const vote = () => {
  const candidateID = $("input[name='candidate']:checked").val();
  if (!candidateID) {
    $("#msg").html("<p>Please vote for a candidate.</p>");
    return;
  }
  VotingContract.deployed().then((instance) => {
    instance.vote(parseInt(candidateID)).then(() => {
      $("#voteButton").prop("disabled", true);
      $("#msg").html("<p>Voted</p>");
      window.location.reload(1);
    }).catch((err) => {
      console.error("Error voting:", err.message);
    });
  });
};

// Initialize app
const initApp = async () => {
  await initializeWeb3();
  loadAccountData();

  $(document).ready(() => {
    addCandidateEvent();
    addDateEvent();
    displayDates();

    VotingContract.deployed().then((instance) => {
      instance.getCountCandidates().then((countCandidates) => {
        displayCandidates(countCandidates);
        window.countCandidates = countCandidates;
      });
    });

    checkVoteAndEnableButton();
  });
};

window.App = {
  initApp: initApp,
  vote: vote,
};

window.addEventListener("load", () => {
  window.App.initApp();
});

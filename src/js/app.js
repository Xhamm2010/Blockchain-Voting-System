// Import CSS (assuming this is being used in a web environment)
// import "../css/style.css";

const Web3 = require('web3');
const contract = require('@truffle/contract');

const votingArtifacts = require('../../build/contracts/Voting.json');
const VotingContract = contract(votingArtifacts);

const initializeWeb3 = () => {
  if (typeof web3 !== "undefined") {
    console.warn("Using web3 detected from external source like Metamask");
    window.eth = new Web3(window.ethereum);
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:9545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for deployment. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    window.eth = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"));
  }
};

const setContractProviderAndDefaults = () => {
  window.ethereum.request({ method: 'eth_requestAccounts' });
  VotingContract.setProvider(window.ethereum);
  VotingContract.defaults({ from: window.ethereum.selectedAddress, gas: 6654755 });
};

const loadAccountData = () => {
  App.account = window.ethereum.selectedAddress;
  $("#accountAddress").html("Your Account: " + window.ethereum.selectedAddress);
};

// const addCandidateEvent = () => {
//   $('#addCandidate').click(() => {
//     const nameCandidate = $('#name').val();
//     const partyCandidate = $('#party').val();
//     VotingContract.deployed().then((instance) => {
//       instance.addCandidate(nameCandidate, partyCandidate).then((result) => {});
//     });
//   });
// };

const addCandidateEvent = () => {
  $('#addCandidate').click(() => {
    console.log('Add candidate button clicked'); // Debug log
    const nameCandidate = $('#name').val();
    const partyCandidate = $('#party').val();
    VotingContract.deployed().then((instance) => {
      console.log('Contract instance obtained'); // Debug log
      instance.addCandidate(nameCandidate, partyCandidate).then((result) => {
        console.log('Candidate added', result); // Debug log
      }).catch((err) => {
        console.error('Error adding candidate:', err.message); // Error log
      });
    }).catch((err) => {
      console.error('Error deploying contract:', err.message); // Error log
    });
  });
};


const addDateEvent = () => {
  $('#addDate').click(() => {
    const startDate = Date.parse(document.getElementById("startDate").value) / 1000;
    const endDate = Date.parse(document.getElementById("endDate").value) / 1000;
    VotingContract.deployed().then((instance) => {
      instance.setDates(startDate, endDate).then((result) => {
        console.log("tarihler verildi");
      });
    });
  });
};

const displayDates = () => {
  VotingContract.deployed().then((instance) => {
    instance.getDates().then((result) => {
      const startDate = new Date(result[0] * 1000);
      const endDate = new Date(result[1] * 1000);
      $("#dates").text(startDate.toDateString("#DD#/#MM#/#YYYY#") + " - " + endDate.toDateString("#DD#/#MM#/#YYYY#"));
    }).catch((err) => {
      console.error("ERROR! " + err.message);
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
        $("#voteButton").attr("disabled", false);
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
    instance.vote(parseInt(candidateID)).then((result) => {
      $("#voteButton").attr("disabled", true);
      $("#msg").html("<p>Voted</p>");
      window.location.reload(1);
    });
  });
};

window.App = {
  eventStart: () => {
    initializeWeb3();

    window.ethereum.request({ method: 'eth_requestAccounts' });
    setContractProviderAndDefaults();

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
  },

  vote: vote,
};

window.addEventListener("load", () => {
  window.App.eventStart();
});

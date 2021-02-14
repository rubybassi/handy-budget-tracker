// prefixes of implementations for cross-browser functionality //https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

// set db variable  
let db;

// open a database called budgetTracker with version
const request = indexedDB.open("budgetTracker", 1);

// error handler if opening db fails
request.onerror = (event) => {
    console.log(`Error: ${event.target.errorCode}`);
  };

// event to update / modify db
request.onupgradeneeded = ({ target }) => {
  let db = target.result;
  // create object store in the db
  db.createObjectStore("pending", { autoIncrement: true });
};

// if onsuccess event is ok then results will be saved later to db variable
request.onsuccess = ({ target }) => {
  db = target.result;
  // check if app is online before reading from db
  if (navigator.onLine) {
    checkDatabase();
  }
};

// function to add data to db
function saveRecord(record) {
  // start a transaction
  const transaction = db.transaction(["pending"], "readwrite");
  // access and save record to object store
  const store = transaction.objectStore("pending");
  store.add(record);
};

// function to post records once online - called in event online listener
const checkDatabase = () => {
  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");
  const getAll = store.getAll();
  getAll.onsuccess = () => {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          return response.json();
        })
        .then(() => {
          // delete records if successful
          const transaction = db.transaction(["pending"], "readwrite");
          const store = transaction.objectStore("pending");
          store.clear();
        });
    }
  };
};

// listen for app coming back online then call post function
window.addEventListener("online", checkDatabase);

const key = "DriverLocation";

let userName;
let marker;
let trackedMarkers = {};
let map = L.map("map");

let getSocket = new WebSocket("ws://localhost:8000/position/get/ws");
let setSocket = new WebSocket("ws://localhost:8000/position/set/ws");

function addNewMarker(name, lat, lng) {
  if (!trackedMarkers.hasOwnProperty(name)) {
    let newMarker = (marker = L.marker([lat, lng])
      .bindPopup(`${name}'s location`)
      .addTo(map));
    trackedMarkers[name] = newMarker;
    setInterval(
      () =>
        getSocket.send(
          JSON.stringify({
            id: name,
            key: key,
          })
        ),
      1000
    );
  }
}

getSocket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.success) {
    console.log(typeof event.data);
    console.log(data);
    let objId = data["id"];
    console.log(data["lat"]);
    console.log(data["long"]);
    let pos = new L.LatLng(data["lat"], data["long"]);
    if (trackedMarkers.hasOwnProperty(objId)) {
      trackedMarkers[objId].setLatLng(pos);
    } else {
      addNewMarker(objId, data.lat, data.long);
    }
  }
};

setSocket.onmessage = (event) => {
  let data = JSON.parse(event.data);
  console.log(data);
};

navigator.geolocation.getCurrentPosition((position) => {
  console.log(position);
  map = map.setView([position.coords.latitude, position.coords.longitude], 13);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  }).addTo(map);
});

map.on("click", (e) => {
  if (userName && !marker) {
    let popLocation = e.latlng;
    console.log(popLocation);
    marker = L.marker([popLocation.lat, popLocation.lng], { draggable: true })
      .bindPopup(`${userName}'s location`)
      .addTo(map);
    marker.on("moveend", (event) => {
      console.log(event);
      let dragLocation = event.sourceTarget._latlng;
      console.log(`lat: ${dragLocation.lat} long: ${dragLocation.lng}`);
      setSocket.send(
        JSON.stringify({
          id: userName,
          key: key,
          lat: dragLocation.lat,
          long: dragLocation.lng,
        })
      );
    });
    setSocket.send(
      JSON.stringify({
        id: userName,
        key: key,
        lat: popLocation.lat,
        long: popLocation.lng,
      })
    );
  }
});

let setName = () => {
  let nameInput = document.getElementById("username").value;

  if (!userName && nameInput) {
    userName = nameInput;
    console.log(userName);
  }
};

let trackMarker = () => {
  let nameInput = document.getElementById("trackuser").value;

  if (!trackedMarkers.hasOwnProperty(nameInput)) {
    getSocket.send(
      JSON.stringify({
        id: nameInput,
        key: key,
      })
    );
  }
};

function createTable(data) {
  // return an HTML table string representing the transcript to insert into the page
  return `
            <table class="table">
            <thead><tr><th scope="col">Name</th><th scope="col">Latitude</th><th scope="col">Longitude</th></tr></thead>
            <tbody>
            ${data.points
              .map(
                (val) =>
                  `<tr><td>${val.id}</td><td>${val.lat}</td><td>${val.long}</td></tr>`
              )
              .join("\n")}
            </tbody>
            </table>
            `;
}

function findLocal() {
  let timeInput = document.getElementById("time").value;
  fetch("http://127.0.0.1:8000/position/nearby", {
    method: "POST",
    body: JSON.stringify({
      id: userName,
      key: key,
      time: timeInput,
    }),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
    },
  })
    .then((response) => response.json())
    .then((json) => {
      console.log(json);
      document.getElementById("search_results").innerHTML = createTable(json);
    });
}

// === Elements ===
const modal = document.getElementById("mapModal");
const btnOpen = document.getElementById("btnOpenMap");
const btnClose = document.getElementById("btnClose");
const btnSave = document.getElementById("btnSave");
const btnLocate = document.getElementById("btnLocate");
const searchBox = document.getElementById("searchBox");
const results = document.getElementById("results");
const locationInput = document.getElementById("locationInput");

let map,
  marker,
  selectedPlace = null;

// === Open modal ===
btnOpen.onclick = () => {
  modal.classList.add("map-modal--active");
  if (!map) initMap();
  setTimeout(() => map.invalidateSize(), 200);
};

// === Close modal ===
btnClose.onclick = () => modal.classList.remove("map-modal--active");

// === Save selected location ===
btnSave.onclick = () => {
  if (selectedPlace) {
    locationInput.value =
      selectedPlace.display_name ||
      `${selectedPlace.lat}, ${selectedPlace.lon}`;
    console.log("Vị trí được chọn:", selectedPlace);
  }
  modal.classList.remove("map-modal--active");
};

// === Initialize map ===
function initMap() {
  map = L.map("map").setView([10.762622, 106.660172], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap",
  }).addTo(map);

  // Click chọn điểm
  map.on("click", async (e) => {
    const { lat, lng } = e.latlng;
    if (marker) marker.remove();
    marker = L.marker([lat, lng]).addTo(map);

    // Gọi API reverse geocoding
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      selectedPlace = {
        lat,
        lon: lng,
        display_name: data.display_name || "Không xác định",
      };

      // Hiển thị luôn tên địa điểm gần nhất
      searchBox.value = data.display_name || "";
    } catch (err) {
      console.error(err);
    }
  });

  // Tìm kiếm địa điểm
  searchBox.addEventListener("keyup", async (e) => {
    const q = e.target.value.trim();
    if (q.length < 3) {
      results.innerHTML = "";
      return;
    }
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${q}`
    );
    const data = await res.json();
    results.innerHTML = "";
    data.slice(0, 5).forEach((place) => {
      const li = document.createElement("li");
      li.classList.add("map-modal__result-item");
      li.textContent = place.display_name;
      li.onclick = () => {
        map.setView([place.lat, place.lon], 15);
        if (marker) marker.remove();
        marker = L.marker([place.lat, place.lon]).addTo(map);
        selectedPlace = place;
        results.innerHTML = "";
        searchBox.value = place.display_name;
      };
      results.appendChild(li);
    });
  });

  // Lấy vị trí hiện tại
  btnLocate.onclick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          if (marker) marker.remove();
          marker = L.marker([latitude, longitude])
            .addTo(map)
            .bindPopup("📍 Bạn đang ở đây")
            .openPopup();
          map.setView([latitude, longitude], 15);

          // Gọi reverse geocoding để lấy tên địa điểm
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
            );
            const data = await res.json();
            selectedPlace = {
              lat: latitude,
              lon: longitude,
              display_name: data.display_name || "Không xác định",
            };
            searchBox.value = data.display_name || "";
          } catch (err) {
            console.error(err);
          }
        },
        (err) => alert("Không thể lấy vị trí: " + err.message)
      );
    } else {
      alert("Trình duyệt không hỗ trợ định vị!");
    }
  };
}

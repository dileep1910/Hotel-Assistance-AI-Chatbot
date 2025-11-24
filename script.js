const GEMINI_API_KEY = "AIzaSyC0iny6uph2g33bi3UjAPaGJPH-dpri6ys"; // Replace with your actual API key
const apiUrl =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Updated keywords for hotel booking
const ALLOWED_KEYWORDS = [
  "hotel",
  "motel",
  "inn",
  "resort",
  "lodge",
  "stay",
  "book",
  "booking",
  "room",
  "suite",
  "accommodation",
  "vacancy",
  "availability",
  "price",
  "budget",
  "cheap",
  "luxury",
  "rating",
  "stars",
  "amenities",
  "pool",
  "gym",
  "breakfast",
  "wifi",
  "parking",
  "location",
  "near",
  "city",
  "airport",
  "dates",
  "check-in",
  "check-out",
  "guests",
  "adults",
  "children",
  "compare",
  "vs",
  "versus",
  "review",
  "deal",
];

let messages = [];
let history = [];
let darkMode = localStorage.getItem("darkMode") === "true";

document.addEventListener("DOMContentLoaded", () => {
  // Get references to DOM elements, updating IDs for hotel theme
  const chatMessages = document.getElementById("chat-messages");
  const userInput = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");
  const newChatBtn = document.getElementById("new-chat");
  const clearHistoryBtn = document.getElementById("clear-history");
  const historyDiv = document.getElementById("history");
  const emptyState = document.getElementById("empty-state");
  const themeToggle = document.getElementById("theme-toggle");
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebar = document.getElementById("sidebar");

  // Hotel Details Modal elements
  const hotelDetailsModal = document.getElementById("hotel-details-modal");
  const hotelDetailsModalClose = document.getElementById(
    "hotel-details-modal-close"
  );
  const hotelDirectionsBtn = document.getElementById("hotel-directions");
  const hotelBookNowBtn = document.getElementById("hotel-book-now");

  // Load history from localStorage (using a new key)
  loadHistory();

  // --- Event Listeners ---

  // Close Hotel Details Modal button
  hotelDetailsModalClose.addEventListener("click", () => {
    hotelDetailsModal.classList.remove("active");
  });

  // Click outside Hotel Details Modal to close
  hotelDetailsModal.addEventListener("click", (e) => {
    if (e.target === hotelDetailsModal) {
      hotelDetailsModal.classList.remove("active");
    }
  });

  // Apply dark mode if previously set
  if (darkMode) {
    document.body.classList.add("dark-theme");
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  }

  // Handle query parameters (e.g., from landing page)
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get("query");
  if (query) {
    hideEmptyState();
    addMessage("user", query);
    getHotelResponse(query);
  }

  // Send button click
  sendBtn.addEventListener("click", () => sendMessage());
  // Enter key press in input
  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // New Chat button
  newChatBtn.addEventListener("click", () => {
    messages = [];
    chatMessages.innerHTML = "";
    showEmptyState();

    // Close sidebar on mobile if open
    if (window.innerWidth <= 768) {
      sidebar.classList.remove("active");
    }

    showToast("New hotel search started", "info");
  });

  // Clear History button
  clearHistoryBtn.addEventListener("click", () => {
    if (
      confirm(
        "Are you sure you want to clear all hotel search history? This cannot be undone."
      )
    ) {
      history = [];
      localStorage.setItem("hotelBooker_history", JSON.stringify(history));
      renderHistory();
      showToast("History cleared", "success");
    }
  });

  // History item click
  historyDiv.addEventListener("click", (e) => {
    const item = e.target.closest(".history-item");
    if (item) {
      const index = item.dataset.index;
      messages = [...history[index].messages];
      renderMessages();

      // Close sidebar on mobile if open
      if (window.innerWidth <= 768) {
        sidebar.classList.remove("active");
      }
    }
  });

  // Theme toggle button
  themeToggle.addEventListener("click", () => {
    darkMode = !darkMode;
    localStorage.setItem("darkMode", darkMode);
    document.body.classList.toggle("dark-theme");
    themeToggle.innerHTML = darkMode
      ? '<i class="fas fa-sun"></i>'
      : '<i class="fas fa-moon"></i>';
  });

  // Sidebar toggle button (for mobile)
  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("active");
  });

  // Click outside sidebar to close (on mobile)
  document.addEventListener("click", (e) => {
    if (
      window.innerWidth <= 768 &&
      !sidebar.contains(e.target) &&
      !sidebarToggle.contains(e.target) &&
      sidebar.classList.contains("active")
    ) {
      sidebar.classList.remove("active");
    }
  });

  // Show empty state if no messages initially
  if (messages.length === 0) {
    showEmptyState();
  }

  // Event delegation for clicking on hotel results in the chat
  chatMessages.addEventListener("click", (e) => {
    const hotelElement = e.target.closest(".hotel-in-results");
    if (hotelElement) {
      const hotelName = hotelElement.dataset.hotelName;
      if (hotelName) {
        showHotelDetails(hotelName);
      }
    }
  });

  // Get Directions button in Hotel Details Modal
  hotelDirectionsBtn.addEventListener("click", () => {
    const hotelName = document.getElementById(
      "hotel-details-title"
    ).textContent;
    const address = document.getElementById("hotel-address")?.textContent || "";

    if (address) {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        address + ", " + hotelName
      )}`;
      window.open(mapsUrl, "_blank");
    } else {
      showToast(`Could not find address for ${hotelName}`, "error");
    }

    hotelDetailsModal.classList.remove("active");
  });

  // Book Now button in Hotel Details Modal
  hotelBookNowBtn.addEventListener("click", () => {
    const hotelName = document.getElementById(
      "hotel-details-title"
    ).textContent;
    const website = document.getElementById("hotel-details-modal").dataset
      .website;

    if (website && website !== "N/A") {
      window.open(website, "_blank");
      showToast(`Opening booking page for ${hotelName}...`, "info");
    } else {
      showToast(
        `Booking functionality for ${hotelName} is not available yet.`,
        "info"
      );
      console.log(`Attempted to book: ${hotelName}`);
    }
    hotelDetailsModal.classList.remove("active");
  });

  // Add event listener for Escape key to close modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (hotelDetailsModal.classList.contains("active")) {
        hotelDetailsModal.classList.remove("active");
      }
    }
  });
});

// --- Core Functions ---

// Adds a message to the chat interface and message history
function addMessage(role, content, timestamp = new Date()) {
  hideEmptyState();
  const formattedContent =
    role === "assistant" ? formatHotelResponse(content) : content;
  messages.push({ role, content: formattedContent, timestamp });
  renderMessages();

  if (role === "assistant" && messages.length >= 2) {
    saveToHistory();
  }
}

// Renders all messages in the chat window
function renderMessages() {
  const chatMessages = document.getElementById("chat-messages");
  chatMessages.innerHTML = "";

  messages.forEach((msg) => {
    const messageContainer = document.createElement("div");
    messageContainer.className = `message-container message-${msg.role}`;

    const meta = document.createElement("div");
    meta.className = "message-meta";

    const timestamp = new Date(msg.timestamp);
    const timeStr = timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    meta.innerHTML =
      msg.role === "user"
        ? `<i class="fas fa-user"></i> You <span class="message-time">${timeStr}</span>`
        : `<i class="fas fa-concierge-bell"></i> Hotel Booker <span class="message-time">${timeStr}</span>`;

    const messageDiv = document.createElement("div");
    messageDiv.className = `chat-message chat-message-${msg.role}`;
    messageDiv.innerHTML = msg.content;

    if (msg.role === "user") {
      const copyBtn = document.createElement("button");
      copyBtn.className = "message-action-btn";
      copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
      copyBtn.title = "Copy message";
      copyBtn.onclick = () => copyToClipboard(msg.content);
      messageDiv.appendChild(copyBtn);
    }

    if (msg.role === "assistant") {
      const feedbackDiv = document.createElement("div");
      feedbackDiv.className = "feedback-buttons";
      feedbackDiv.innerHTML = `
        <button class="feedback-btn" title="Good response"><i class="fas fa-thumbs-up"></i></button>
        <button class="feedback-btn" title="Bad response"><i class="fas fa-thumbs-down"></i></button>
      `;
      messageContainer.appendChild(feedbackDiv);
    }

    messageContainer.appendChild(meta);
    messageContainer.appendChild(messageDiv);
    chatMessages.appendChild(messageContainer);
  });

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Renders the search history in the sidebar
function renderHistory() {
  const historyDiv = document.getElementById("history");
  historyDiv.innerHTML = "";

  history.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.dataset.index = index;

    const date = new Date(item.timestamp);
    const formattedDate =
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    div.innerHTML = `
      <i class="fas fa-bed"></i>
      <div>
        <span>${item.title.substring(0, 30)}${
      item.title.length > 30 ? "..." : ""
    }</span>
        <span class="history-date">${formattedDate}</span>
      </div>
    `;
    historyDiv.appendChild(div);
  });
}

// Saves the current chat session to history and localStorage
function saveToHistory() {
  const userMessage = messages.find((msg) => msg.role === "user");
  const title =
    userMessage?.content?.substring(0, 50) +
      (userMessage?.content?.length > 50 ? "..." : "") || "Untitled Search";

  const historyItem = {
    id: Date.now(),
    title: title,
    messages: [...messages],
    timestamp: new Date(),
  };

  const exists = history.findIndex((h) => h.id === historyItem.id);
  if (exists > -1) {
    history[exists] = historyItem;
  } else {
    history.unshift(historyItem);
  }

  localStorage.setItem("hotelBooker_history", JSON.stringify(history));
  renderHistory();
}

// Loads history from localStorage
function loadHistory() {
  const savedHistory = localStorage.getItem("hotelBooker_history");
  if (savedHistory) {
    try {
      history = JSON.parse(savedHistory);
      renderHistory();
    } catch (error) {
      console.error("Error loading history:", error);
      localStorage.removeItem("hotelBooker_history");
    }
  }
}

// Formats the raw response from the AI for hotel listings or general chat
function formatHotelResponse(response) {
  try {
    const jsonData = JSON.parse(response);
    if (jsonData.name && (jsonData.rating || jsonData.price_range)) {
      return formatSingleHotelDetails(jsonData);
    }
  } catch (e) {
    // Not JSON or not the expected structure, proceed with text formatting
  }

  if (response.match(/^(Hotels|Accommodations)\s+in\s+([^:]+):/i)) {
    let cleanedText = response.replace(/<[^>]*>/g, "");
    let formattedResponse = `<div class="resource-response hotel-list-response">`;

    const cityMatch = cleanedText.match(
      /^(Hotels|Accommodations)\s+in\s+([^:]+):/i
    );
    const searchTopic = cityMatch
      ? cityMatch[2].trim()
      : "your specified location";

    formattedResponse += `
          <div class="resource-response-header">
              <i class="fas fa-map-marked-alt"></i>
              <span>Hotels in ${searchTopic}</span>
          </div>
      `;

    cleanedText = cleanedText
      .replace(/^(Hotels|Accommodations)\s+in\s+([^:]+):\s*/i, "")
      .trim();
    cleanedText = cleanedText
      .replace(
        /^(Here are a few options:|I found the following hotels:)\s*/i,
        ""
      )
      .trim();

    formattedResponse += `<div class="resource-list-container" style="padding: 15px 20px;">`;

    let hotelEntries = [];

    const numberedPattern = cleanedText.match(/\d+\.\s+([^:]+):/g);

    if (numberedPattern && numberedPattern.length > 0) {
      const parts = cleanedText.split(/\d+\.\s+[^:]+:/);
      parts.shift();

      hotelEntries = numberedPattern.map((header, i) => {
        const name = header
          .replace(/^\d+\.\s+/, "")
          .replace(/:$/, "")
          .trim();
        const description = parts[i] ? parts[i].trim() : "";
        return { name, description };
      });
    } else {
      const hotelBlocks = cleanedText
        .split(/\n\s*\n|\n\s*\d+\.\s+/)
        .filter((block) => block.trim());

      hotelEntries = hotelBlocks
        .map((block) => {
          const lines = block.trim().split("\n");
          if (lines.length === 0) return null;

          const hotelNameMatch = lines[0].match(/^([^-–—:]+)/);
          const name = hotelNameMatch
            ? hotelNameMatch[1].trim()
            : lines[0].trim();

          let description = "";
          if (lines.length > 1) {
            description = lines.slice(1).join(" ").trim();
          } else if (lines[0].includes(":")) {
            const parts = lines[0].split(":");
            description = parts.slice(1).join(":").trim();
          } else if (lines[0].match(/[–—-]/)) {
            const parts = lines[0].split(/[–—-]/);
            description = parts.slice(1).join(" ").trim();
          }

          return { name, description };
        })
        .filter((entry) => entry && entry.name);
    }

    hotelEntries.forEach((entry, index) => {
      if (entry.name) {
        const cleanName = entry.name.replace(/[<>]/g, "");

        formattedResponse += `
                  <div class="hotel-in-results" data-hotel-name="${cleanName}" title="Click for details" style="margin-bottom: 5px; display: inline-block; background: #f0f9fa; padding: 8px 12px; border-radius: 6px; cursor: pointer;">
                      <i class="fas fa-info-circle"></i> View Details & Check Availability
                  </div>`;

        formattedResponse += `<div style="margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px dashed #ddd;">`;
        formattedResponse += `${index + 1}. <strong>${cleanName}</strong>`;

        if (entry.description && !entry.description.includes(cleanName)) {
          formattedResponse += `<p style="margin-top: 5px; margin-left: 15px; color: #444;">${entry.description}</p>`;
        }

        formattedResponse += `</div>`;
      }
    });

    if (hotelEntries.length === 0) {
      formattedResponse += `<div style="text-align: center; padding: 20px;">
              <i class="fas fa-exclamation-circle" style="color: #f39c12; font-size: 24px; margin-bottom: 10px;"></i>
              <p>Sorry, I couldn't structure the hotel information properly. Here's the raw information:</p>
              <div style="text-align: left; background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 10px;">
                  ${cleanedText.replace(/\n/g, "<br>")}
              </div>
          </div>`;
    }

    formattedResponse += `</div>`;

    formattedResponse += `
          <div class="resource-response-footer">
              <i class="fas fa-question-circle"></i>
              Click 'View Details' on a hotel or ask for more specific criteria (e.g., 'with a pool', 'pet-friendly', 'near airport').
          </div>`;

    formattedResponse += `</div>`;
    return formattedResponse;
  }

  let generalFormatted = response
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");

  if (response.match(/^[\s\n]*[-*•]\s+/m)) {
    generalFormatted = generalFormatted
      .replace(/(<br>|^)\s*[-*•]\s+/g, "$1<br>• ")
      .replace(/(<br>• .*?)(<br>)(?!\s*[-*•]\s+)/g, "$1</li>$2");
  }

  return `<div class="chat-message-text">${generalFormatted}</div>`;
}

// Formats a single hotel's details (assuming input is a JS object)
function formatSingleHotelDetails(hotelData) {
  let summary = `<div class="single-hotel-preview">`;

  summary += `<h3 style="margin-bottom: 10px; color: #0097A7;">${
    hotelData.name || "Hotel Details"
  }</h3>`;

  summary += `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">`;

  if (hotelData.rating)
    summary += `<div><i class="fas fa-star" style="color: #FF9800;"></i> <strong>Rating:</strong> ${hotelData.rating}</div>`;

  if (hotelData.price_range)
    summary += `<div><i class="fas fa-dollar-sign" style="color: #43A047;"></i> <strong>Price:</strong> ${hotelData.price_range}</div>`;

  if (hotelData.location_description || hotelData.address)
    summary += `<div style="grid-column: span 2;"><i class="fas fa-map-marker-alt" style="color: #E53935;"></i> <strong>Location:</strong> ${
      hotelData.location_description || hotelData.address
    }</div>`;

  summary += `</div>`;

  if (hotelData.description) {
    summary += `<div style="margin: 10px 0; padding: 10px; background: #f0f9fa; border-radius: 8px;">
          <strong>Description:</strong> ${hotelData.description}
      </div>`;
  }

  if (
    hotelData.amenities &&
    Array.isArray(hotelData.amenities) &&
    hotelData.amenities.length > 0
  ) {
    const displayAmenities = hotelData.amenities.slice(0, 3);
    summary += `<div style="margin-top: 10px;"><strong>Key Amenities:</strong> ${displayAmenities.join(
      ", "
    )}`;
    if (hotelData.amenities.length > 3)
      summary += ` and ${hotelData.amenities.length - 3} more`;
    summary += `</div>`;
  }

  summary += `<button class="hotel-in-results" data-hotel-name="${hotelData.name}"
      style="display: block; margin: 15px auto 5px; padding: 10px 15px; background: var(--primary-gradient);
      color: white; border: none; border-radius: 25px; cursor: pointer; box-shadow: 0 2px 5px rgba(0,151,167,0.3);">
      <i class="fas fa-info-circle"></i> View Complete Details
  </button>`;

  summary += `</div>`;
  return summary;
}

// Hides the initial empty state message
function hideEmptyState() {
  const emptyState = document.getElementById("empty-state");
  if (emptyState) {
    emptyState.style.display = "none";
  }
}

// Shows the initial empty state message
function showEmptyState() {
  const emptyState = document.getElementById("empty-state");
  const chatMessages = document.getElementById("chat-messages");

  if (emptyState) {
    chatMessages.innerHTML = "";
    emptyState.style.display = "flex";
    chatMessages.appendChild(emptyState);
  } else {
    const newEmptyState = document.createElement("div");
    newEmptyState.id = "empty-state";
    newEmptyState.className = "empty-state";
    newEmptyState.innerHTML = `
      <div class="empty-icon">
        <i class="fas fa-suitcase-rolling"></i>
      </div>
      <h2>Welcome to Hotel Booker</h2>
      <p>Your AI assistant for finding and booking the perfect hotel.</p>
      <div class="feature-list">
        <div class="feature-item">
          <i class="fas fa-map-marker-alt"></i>
          <span>"Hotels in Paris near Eiffel Tower"</span>
        </div>
        <div class="feature-item">
          <i class="fas fa-calendar-alt"></i>
          <span>"Find hotels for July 10-15"</span>
        </div>
        <div class="feature-item">
          <i class="fas fa-dollar-sign"></i>
          <span>"Budget hotels under $150"</span>
        </div>
        <div class="feature-item">
           <i class="fas fa-star"></i>
          <span>"5-star hotels with a pool"</span>
        </div>
      </div>
      <p class="start-prompt">
        Where and when would you like to travel?
      </p>
    `;
    chatMessages.innerHTML = "";
    chatMessages.appendChild(newEmptyState);
  }
}

// Fetches response from Gemini API for hotel queries
async function getHotelResponse(userInput) {
  const inputLower = userInput.toLowerCase();
  if (!ALLOWED_KEYWORDS.some((keyword) => inputLower.includes(keyword))) {
    addMessage(
      "assistant",
      "⚠️ I specialize in hotel booking assistance. Please ask about hotels, locations, dates, or amenities (e.g., 'Hotels in New York with a gym' or 'Find a budget hotel near LAX for next Tuesday')."
    );
    return;
  }

  const chatMessages = document.getElementById("chat-messages");
  const typingIndicator = document.createElement("div");
  typingIndicator.className = "typing";
  typingIndicator.innerHTML = "<span></span><span></span><span></span>";
  chatMessages.appendChild(typingIndicator);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const prompt = `You are "Hotel Booker", an AI assistant specializing in finding and providing information about hotels.
      User query: "${userInput}"

            Based on the user query, provide relevant hotel information.

            When listing hotels (e.g., "hotels in London", "budget hotels near LAX"):
            1. Start the response with "Hotels in [Location]:"
            2. For each hotel (provide 3-5 options), include:
               - Hotel name as a distinct heading
               - A 1-2 sentence description covering key features, location benefits, and notable amenities
               - Rating information (stars or review score) if relevant
               - Price category or range if relevant
            3. Format each hotel as a distinct entry with numbering (1., 2., etc.)
            4. Keep information well-structured and easily scannable

            If asked about a specific hotel, provide a comprehensive overview of that property.

            Keep responses focused on hotel booking. If information is uncertain, provide realistic approximations rather than saying "I don't know specific details."`;

    const response = await fetch(`${apiUrl}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.6,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (typingIndicator.parentNode === chatMessages) {
      chatMessages.removeChild(typingIndicator);
    }

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (
      data.candidates &&
      data.candidates.length > 0 &&
      data.candidates[0].content
    ) {
      let rawResponse = data.candidates[0].content.parts[0].text;

      if (
        rawResponse.trim().startsWith("{") &&
        rawResponse.trim().endsWith("}")
      ) {
        try {
          const jsonData = JSON.parse(rawResponse);
          if (jsonData.name) {
            populateHotelDetailsModal(jsonData);
            return;
          }
        } catch (e) {
          console.warn(
            "Received JSON-like response, but failed to parse or validate:",
            e
          );
        }
      }

      addMessage("assistant", rawResponse);
    } else {
      console.warn("API response missing candidates or content:", data);
      addMessage(
        "assistant",
        "Sorry, I couldn't retrieve any information for that request. Could you try rephrasing?"
      );
      showToast("No information found", "warning");
    }
  } catch (error) {
    if (typingIndicator.parentNode === chatMessages) {
      chatMessages.removeChild(typingIndicator);
    }
    console.error("Error fetching hotel response:", error);
    addMessage(
      "assistant",
      `Sorry, I encountered an error trying to find hotel information: ${error.message}. Please try again later.`
    );
    showToast("Error getting hotel information", "error");
  }
}

// Fetches and displays detailed information for a specific hotel in the modal
async function showHotelDetails(hotelName) {
  const hotelDetailsModal = document.getElementById("hotel-details-modal");
  const titleElement = document.getElementById("hotel-details-title");
  const imageElement = document.getElementById("hotel-image");
  const ratingElement = document.getElementById("hotel-rating");
  const priceRangeElement = document.getElementById("hotel-price-range");
  const locationElement = document.getElementById("hotel-location");
  const categoriesElement = document.getElementById("hotel-categories");
  const descriptionElement = document.getElementById("hotel-description");
  const amenitiesElement = document.getElementById("hotel-amenities-list");
  const featuresElement = document.getElementById("hotel-features-info");
  const addressElement = document.getElementById("hotel-address");

  titleElement.textContent = hotelName;
  ratingElement.innerHTML = '<i class="fas fa-star"></i> Loading...';
  priceRangeElement.innerHTML = '<i class="fas fa-dollar-sign"></i> Loading...';
  locationElement.innerHTML =
    '<i class="fas fa-map-marker-alt"></i> Loading...';
  categoriesElement.innerHTML = "";
  descriptionElement.textContent = "Loading hotel information...";
  amenitiesElement.textContent = "Loading...";
  featuresElement.textContent = "Loading...";
  addressElement.textContent = "";
  hotelDetailsModal.dataset.website = "";

  hotelDetailsModal.classList.add("active");

  try {
    const existingHotel = messages.find((msg) => {
      if (msg.role !== "assistant") return false;
      try {
        const data = JSON.parse(msg.content);
        return (
          data &&
          data.name &&
          data.name.toLowerCase() === hotelName.toLowerCase()
        );
      } catch (e) {
        return false;
      }
    });

    if (existingHotel) {
      try {
        const hotelData = JSON.parse(existingHotel.content);
        populateHotelDetailsModal(hotelData);
        return;
      } catch (e) {
        console.log(
          "Failed to reuse existing hotel data, proceeding with new API call"
        );
      }
    }

    const prompt = `You are "Hotel Booker". Provide detailed information about the hotel "${hotelName}" in JSON format only.
        Include these fields if available:
        - name: Full hotel name.
        - rating: Star rating (e.g., "4.5 Stars") or user score (e.g., "8.8/10").
        - price_range: Price category (e.g., "$$", "$$$$", "Budget", "Luxury") or approximate range (e.g., "$150-$250").
        - address: Full street address.
        - location_description: Brief description of location (e.g., "Downtown near Convention Center", "5 miles from Airport").
        - phone: Contact phone number.
        - website: Official website URL.
        - description: A detailed paragraph describing the hotel (4-6 sentences). Include information about its style, ambiance, history if notable, and key selling points.
        - amenities: Array of at least 6-8 key amenities (strings, e.g., ["Free WiFi", "Swimming Pool", "Fitness Center", "Restaurant", "Pet-friendly", "Free Breakfast"]).
        - features: Array of 4-6 other notable features (strings, e.g., ["Spa Services", "Business Center", "Airport Shuttle", "Ocean View Rooms"]).
        - categories: Array of relevant categories (strings, e.g., ["Business", "Family-friendly", "Luxury", "Budget", "Airport Hotel"]).
        - image_url: Suggest a relevant placeholder image URL from a service like Unsplash or Pexels that represents this type of hotel.
        - nearby_attractions: Array of 3-5 nearby points of interest or attractions.

        Return *only* the valid JSON object. Do not include any introductory text, backticks, or explanations. If information for a field is unavailable, omit the field or use "N/A".`;

    const response = await fetch(`${apiUrl}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (data.candidates && data.candidates[0].content) {
      let jsonString = data.candidates[0].content.parts[0].text;
      jsonString = jsonString.replace(/^```json\s*|```$/g, "").trim();

      try {
        const hotelData = JSON.parse(jsonString);
        populateHotelDetailsModal(hotelData);
      } catch (e) {
        console.error(
          "Failed to parse JSON response for hotel details:",
          e,
          "\nRaw response:",
          jsonString
        );
        showErrorInHotelModal(
          hotelName,
          "Could not process the hotel details. The format received was unexpected."
        );
      }
    } else {
      throw new Error("No details received from API.");
    }
  } catch (error) {
    console.error("Error fetching hotel details:", error);
    showErrorInHotelModal(
      hotelName,
      `Error retrieving hotel information: ${error.message}. Please try again later.`
    );
  }
}

// Populates the Hotel Details modal with data from a JSON object
function populateHotelDetailsModal(hotelData) {
  const titleElement = document.getElementById("hotel-details-title");
  const imageElement = document.getElementById("hotel-image");
  const ratingElement = document.getElementById("hotel-rating");
  const priceRangeElement = document.getElementById("hotel-price-range");
  const locationElement = document.getElementById("hotel-location");
  const categoriesElement = document.getElementById("hotel-categories");
  const descriptionElement = document.getElementById("hotel-description");
  const amenitiesElement = document.getElementById("hotel-amenities-list");
  const featuresElement = document.getElementById("hotel-features-info");
  const addressElement = document.getElementById("hotel-address");
  const hotelDetailsModal = document.getElementById("hotel-details-modal");

  titleElement.textContent = hotelData.name || "Hotel Details";
  imageElement.src =
    hotelData.image_url ||
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&q=80&w=800";
  imageElement.alt = `${hotelData.name || "Hotel"} Image`;

  ratingElement.innerHTML = `<i class="fas fa-star"></i> ${
    hotelData.rating || "N/A"
  }`;
  priceRangeElement.innerHTML = `<i class="fas fa-dollar-sign"></i> ${
    hotelData.price_range || "N/A"
  }`;
  locationElement.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${
    hotelData.location_description || hotelData.address || "N/A"
  }`;

  addressElement.textContent = hotelData.address || "";
  hotelDetailsModal.dataset.website = hotelData.website || "";

  descriptionElement.textContent =
    hotelData.description || "No description available.";

  categoriesElement.innerHTML = "";
  if (
    hotelData.categories &&
    Array.isArray(hotelData.categories) &&
    hotelData.categories.length > 0
  ) {
    hotelData.categories.forEach((cat) => {
      if (cat && typeof cat === "string") {
        const tag = document.createElement("span");
        tag.className = "category-tag";
        tag.textContent = cat.trim();
        categoriesElement.appendChild(tag);
      }
    });
  } else {
    categoriesElement.innerHTML = '<span class="category-tag">General</span>';
  }

  if (
    hotelData.amenities &&
    Array.isArray(hotelData.amenities) &&
    hotelData.amenities.length > 0
  ) {
    const amenityIcons = {
      wifi: "fa-wifi",
      internet: "fa-wifi",
      pool: "fa-swimming-pool",
      swim: "fa-swimming-pool",
      gym: "fa-dumbbell",
      fitness: "fa-dumbbell",
      restaurant: "fa-utensils",
      dining: "fa-utensils",
      breakfast: "fa-coffee",
      coffee: "fa-coffee",
      bar: "fa-glass-martini-alt",
      lounge: "fa-glass-martini-alt",
      parking: "fa-parking",
      garage: "fa-parking",
      pet: "fa-paw",
      dog: "fa-paw",
      cat: "fa-paw",
      air: "fa-fan",
      conditioning: "fa-fan",
      spa: "fa-spa",
      massage: "fa-spa",
      laundry: "fa-tshirt",
      cleaning: "fa-tshirt",
      tv: "fa-tv",
      television: "fa-tv",
      "room service": "fa-concierge-bell",
      concierge: "fa-concierge-bell",
      shuttle: "fa-shuttle-van",
      transport: "fa-shuttle-van",
      business: "fa-briefcase",
      meeting: "fa-briefcase",
      conference: "fa-briefcase",
      child: "fa-child",
      kids: "fa-child",
      baby: "fa-baby",
      family: "fa-users",
      garden: "fa-leaf",
      terrace: "fa-leaf",
    };

    let amenitiesHTML =
      '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">';

    hotelData.amenities.forEach((item) => {
      if (item && typeof item === "string") {
        const itemLower = item.toLowerCase();
        let iconClass = "fa-check-circle";

        for (const [keyword, icon] of Object.entries(amenityIcons)) {
          if (itemLower.includes(keyword)) {
            iconClass = icon;
            break;
          }
        }

        amenitiesHTML += `
                  <div style="margin-bottom: 8px;">
                      <i class="fas ${iconClass}" style="color: var(--success-color); margin-right: 8px; width: 16px; text-align: center;"></i>
                      ${item.trim()}
                  </div>`;
      }
    });

    amenitiesHTML += "</div>";
    amenitiesElement.innerHTML = amenitiesHTML;
  } else {
    amenitiesElement.textContent = "No specific amenities listed.";
  }

  if (
    hotelData.features &&
    Array.isArray(hotelData.features) &&
    hotelData.features.length > 0
  ) {
    let featuresHTML =
      '<div style="display: grid; grid-template-columns: 1fr; gap: 8px;">';

    hotelData.features.forEach((item) => {
      if (item && typeof item === "string") {
        featuresHTML += `
                  <div style="padding: 8px 12px; background: #f0f9fa; border-radius: 6px; margin-bottom: 4px;">
                      <i class="fas fa-check-circle" style="color: var(--success-color); margin-right: 8px;"></i>
                      ${item.trim()}
                  </div>`;
      }
    });

    featuresHTML += "</div>";
    featuresElement.innerHTML = featuresHTML;
  } else {
    featuresElement.textContent = "No specific features listed.";
  }

  if (
    hotelData.nearby_attractions &&
    Array.isArray(hotelData.nearby_attractions) &&
    hotelData.nearby_attractions.length > 0
  ) {
    const modalBody = document.querySelector(".modal-body");

    let attractionsSection = document.getElementById("hotel-attractions");
    if (!attractionsSection) {
      attractionsSection = document.createElement("div");
      attractionsSection.classList.add("resource-services");
      attractionsSection.id = "hotel-attractions";
      attractionsSection.innerHTML = `
              <h4><i class="fas fa-map-marked-alt"></i> Nearby Attractions</h4>
              <div id="hotel-attractions-list"></div>
          `;
      modalBody.appendChild(attractionsSection);
    }

    const attractionsList = document.getElementById("hotel-attractions-list");
    attractionsList.innerHTML = hotelData.nearby_attractions
      .map(
        (attraction) => `<div style="margin-bottom: 8px;">
              <i class="fas fa-landmark" style="color: var(--primary-color); margin-right: 8px;"></i>
              ${attraction}
          </div>`
      )
      .join("");
  }
}

// Shows an error message within the Hotel Details modal
function showErrorInHotelModal(hotelName, message) {
  document.getElementById("hotel-details-title").textContent = hotelName;
  document.getElementById("hotel-image").src =
    "https://via.placeholder.com/180x180?text=Error";
  document.getElementById("hotel-rating").innerHTML =
    '<i class="fas fa-star"></i> N/A';
  document.getElementById("hotel-price-range").innerHTML =
    '<i class="fas fa-dollar-sign"></i> N/A';
  document.getElementById("hotel-location").innerHTML =
    '<i class="fas fa-map-marker-alt"></i> N/A';
  document.getElementById("hotel-categories").innerHTML = "";
  document.getElementById("hotel-description").textContent = message;
  document.getElementById("hotel-amenities-list").textContent = "Not available";
  document.getElementById("hotel-features-info").textContent = "Not available";
  document.getElementById("hotel-address").textContent = "";
  document.getElementById("hotel-details-modal").dataset.website = "";
}

// Handles sending the user's message
function sendMessage() {
  const userInput = document.getElementById("user-input");
  const content = userInput.value.trim();

  if (content) {
    addMessage("user", content);
    getHotelResponse(content);
    userInput.value = "";
  }
}

// --- Utility Functions ---

// Shows a temporary notification toast
function showToast(message, type = "info") {
  const existingToast = document.querySelector(".toast");
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  let icon = "";
  switch (type) {
    case "success":
      icon = '<i class="fas fa-check-circle"></i>';
      break;
    case "error":
      icon = '<i class="fas fa-times-circle"></i>';
      break;
    case "warning":
      icon = '<i class="fas fa-exclamation-triangle"></i>';
      break;
    default:
      icon = '<i class="fas fa-info-circle"></i>';
  }

  toast.innerHTML = `${icon} ${message}`;
  document.body.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode === document.body) {
      toast.remove();
    }
  }, 3000);
}

// Copies text to the clipboard
function copyToClipboard(text) {
  const plainText = text.replace(/<[^>]*>?/gm, "").replace(/ /g, " ");
  navigator.clipboard.writeText(plainText).then(
    () => showToast("Copied to clipboard", "success"),
    () => showToast("Failed to copy", "error")
  );
}
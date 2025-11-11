document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

  // Clear loading message
  activitiesList.innerHTML = "";

  // Reset activity select (keep placeholder)
  activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <strong>Participants:</strong>
            <div class="participants-wrapper"></div>
          </div>
        `;

        const participantsWrapper = activityCard.querySelector('.participants-wrapper');

        if (details.participants.length > 0) {
          const ul = document.createElement('ul');
          ul.className = 'participants-list';

          details.participants.forEach((p) => {
            const li = document.createElement('li');

            const span = document.createElement('span');
            span.className = 'participant-email';
            span.textContent = p;

            const btn = document.createElement('button');
            btn.className = 'participant-delete';
            btn.setAttribute('aria-label', `Remove ${p} from ${name}`);
            btn.innerHTML = '✖';

            btn.addEventListener('click', async () => {
              if (!confirm(`Unregister ${p} from ${name}?`)) return;

              try {
                const res = await fetch(`/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(p)}`, {
                  method: 'POST',
                });

                const data = await res.json();
                if (res.ok) {
                  // Refresh activities to update UI (simple approach)
                  fetchActivities();
                } else {
                  alert(data.detail || 'Failed to unregister participant');
                }
              } catch (err) {
                console.error('Error unregistering:', err);
                alert('Failed to unregister. Check console for details.');
              }
            });

            li.appendChild(span);
            li.appendChild(btn);
            ul.appendChild(li);
          });

          participantsWrapper.appendChild(ul);
        } else {
          participantsWrapper.innerHTML = '<p class="no-participants">No participants yet</p>';
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();
        // Refresh activities so the newly signed-up participant shows up immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});

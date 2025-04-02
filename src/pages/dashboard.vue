<script setup lang="ts">
import { computed, onMounted, ref, onUnmounted } from "vue";
import { createClient } from "@supabase/supabase-js";

// Assume TheHeader and TheFooter components exist (or remove if not used)
// import TheHeader from './components/TheHeader.vue';
// import TheFooter from './components/TheFooter.vue';


const SUPABASE_URL = "https://tcvwcyovxfyfijkrahjl.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjdndjeW92eGZ5Zmlqa3JhaGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwNzA0ODEsImV4cCI6MjA1ODY0NjQ4MX0.0uJ4TepuTM6rTmZx4DdaLLGUrUvC6xqvxWh1DcldqIw";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Interfaces ---
interface Option {
  id: number;
  name: string;
  election_id: number;
  votes: number;
  created_at?: string;
  updated_at?: string;
}

interface Election {
  id: number;
  name: string;
  description?: string;
  status: boolean; // <-- This determines if the election is generally active
  start_data: string; // ISO String - Voting start time
  end_data: string;   // ISO String - Voting end time
  created_at?: string;
  updated_at?: string;
  option: Option[];
}

// --- Reactive State ---
const elections = ref<Election[]>([]);
const selectedElection = ref<Election | null>(null);
const isLoading = ref(true);
const errorMsg = ref<string | null>(null);

// --- Voting State ---
// Use a random ID for this browser session to track votes
const userId = ref<string>("anon_" + Math.random().toString(36).substring(2, 9));
// Key: Random UserID (string), Value: Map<ElectionID (number), VotedOptionID (number | null)>
// This map will essentially only ever hold one key (the current userId)
const userVotes = ref(new Map<string, Map<number, number | null>>());

// --- Time State ---
const currentTime = ref(new Date());
let timerId: number | undefined = undefined;


// --- Computed Properties ---
// Determines if the *selected* election is currently votable
const isElectionActiveForVoting = computed(() => {
  // 1. Must have a selected election
  if (!selectedElection.value) {
    return false;
  }
  // 2. The election's 'status' flag must be true (set by admin)
  if (!selectedElection.value.status) {
    console.log(`Election ${selectedElection.value.id} is inactive (status: false)`);
    return false;
  }
  // 3. The current time must be within the start and end dates
  try {
    const startDate = new Date(selectedElection.value.start_data);
    const endDate = new Date(selectedElection.value.end_data);
    const now = currentTime.value; // Use the reactive currentTime

    // Log times for debugging
    // console.log(`Checking Election ${selectedElection.value.id}: Now (${now.toISOString()}) vs Start (${startDate.toISOString()}) vs End (${endDate.toISOString()})`);

    // Check: now >= start AND now <= end
    const isActiveTime = now >= startDate && now <= endDate;
    // if (!isActiveTime) console.log(`Election ${selectedElection.value.id} is outside active time window.`);
    return isActiveTime;

  } catch (e) {
    console.error("Error parsing election dates for ID:", selectedElection.value.id, e);
    return false; // Treat date parsing errors as inactive
  }
});

// --- Lifecycle Hooks ---
onMounted(() => {
  // Check time more frequently (e.g., every 30 seconds) for better accuracy
  timerId = setInterval(() => {
    currentTime.value = new Date();
    // console.log("Current time updated:", currentTime.value.toISOString()); // Debug time update
  }, 30000) as unknown as number;

  loadVotesFromLocalStorage();
  fetchElections();
});

onUnmounted(() => {
  clearInterval(timerId);
  saveVotesToLocalStorage();
});

// --- Voting Persistence (LocalStorage - Session Specific using Random ID) ---
function loadVotesFromLocalStorage() {
    const currentUserId = userId.value;
    if (!currentUserId) return;
    const storedVotesKey = `userVotes_${currentUserId}`;
    const storedVotes = localStorage.getItem(storedVotesKey);
    console.log(`Loading votes for session ${currentUserId} from key ${storedVotesKey}`);
    const sessionVoteMap = new Map<number, number | null>();
    if (storedVotes) {
        try {
            const parsedArray: [number, number | null][] = JSON.parse(storedVotes);
            parsedArray.forEach(([electionId, optionId]) => {
                sessionVoteMap.set(electionId, optionId);
            });
             console.log('Votes loaded for session:', sessionVoteMap);
        } catch (e) {
            console.error("Failed to parse votes from local storage for session", currentUserId, e);
            localStorage.removeItem(storedVotesKey);
        }
    } else {
         console.log('No votes found in LS for this session.');
    }
    // Ensure the map for the current user exists in the main ref
    userVotes.value.set(currentUserId, sessionVoteMap);
}

function saveVotesToLocalStorage() {
    const currentUserId = userId.value;
    if (!currentUserId) return;
    const votesForCurrentSession = userVotes.value.get(currentUserId);
    if (votesForCurrentSession) {
        try {
            const storedVotesKey = `userVotes_${currentUserId}`;
            const serializableArray = Array.from(votesForCurrentSession.entries());
            localStorage.setItem(storedVotesKey, JSON.stringify(serializableArray));
            console.log(`Votes saved for session ${currentUserId} to key ${storedVotesKey}`);
        } catch (e) {
            console.error("Failed to save votes to local storage for session", currentUserId, e);
        }
    }
}

// --- Supabase Data Operations ---
async function fetchElections() {
  isLoading.value = true;
  errorMsg.value = null;
  try {
    const { data, error } = await supabase
      .from("election")
      .select(`
        id, name, description, status, start_data, end_data, created_at, updated_at,
        option ( id, name, election_id, created_at, updated_at, votes )
      `)
      .order('id', { ascending: true }); // Or order as needed

    if (error) throw error;

    elections.value = data.map(election => ({
        ...election,
        // Ensure votes is a number, default to 0 if null/undefined/missing
        option: (election.option || []).map(opt => ({
            ...opt,
            votes: typeof opt.votes === 'number' ? opt.votes : 0
        }))
    })) as Election[];

    // Refresh selected election data if it exists
    if (selectedElection.value) {
        const refreshed = elections.value.find(e => e.id === selectedElection.value?.id);
        selectedElection.value = refreshed || null;
    }

  } catch (err: any) {
    console.error("Error fetching elections:", err);
    errorMsg.value = `Ma'lumotlarni yuklashda xatolik: ${err.message}`;
    elections.value = []; // Clear elections on error
  } finally {
    isLoading.value = false;
  }
}

// --- Voting Logic ---
async function voteForOption(option: Option, electionId: number) {
    const currentUserId = userId.value;

    // Re-check election activity right before voting attempt
    if (!isElectionActiveForVoting.value) {
        // Provide more specific feedback if possible
        const election = elections.value.find(e => e.id === electionId);
        if (election && !election.status) {
             alert("Bu saylov admin tomonidan nofaol qilingan.");
        } else if (election && new Date(election.start_data) > currentTime.value) {
             alert("Ovoz berish hali boshlanmagan.");
        } else if (election && new Date(election.end_data) < currentTime.value) {
             alert("Ovoz berish vaqti tugagan.");
        } else {
             alert("Saylov hozirda faol emas.");
        }
        return;
    }

    const votesForCurrentSession = userVotes.value.get(currentUserId);
     if (!votesForCurrentSession) {
        console.error("Vote map for current session not found! Re-initializing.");
        alert("Xatolik yuz berdi (session map). Iltimos sahifani yangilang.");
        userVotes.value.set(currentUserId, new Map<number, number|null>()); // Initialize if missing
        return; // Prevent voting until reloaded maybe
    }

    if (votesForCurrentSession.has(electionId)) {
        alert("Siz bu saylovda allaqachon ovoz bergansiz.");
        return;
    }

    if (typeof option.votes !== 'number') {
         console.error("Vote count is not a number for option:", option);
         alert("Ovozlar sonida xatolik. Iltimos sahifani yangilang.");
         return;
    }

    const originalVoteCount = option.votes;
    // Set loading specific to this option/button if needed, or use global isLoading
    // For simplicity, using global isLoading
    isLoading.value = true;
    errorMsg.value = null;

    try {
        // Optimistic UI update
        option.votes += 1;
        votesForCurrentSession.set(electionId, option.id); // Record vote in the session map
        saveVotesToLocalStorage(); // Save immediately

        // Update the database
        const { data: updatedOption, error: updateError } = await supabase
            .from("option")
            .update({ votes: originalVoteCount + 1 }) // Use original + 1 for safety
            .eq("id", option.id)
            .select('votes')
            .single();

        if (updateError) throw updateError; // Let catch block handle rollback

        // Optional: Verify DB update matches expectation
        if (updatedOption && typeof updatedOption.votes === 'number' && updatedOption.votes !== option.votes) {
            console.warn(`DB vote count (${updatedOption.votes}) differs from optimistic count (${option.votes}). Updating UI.`);
            option.votes = updatedOption.votes; // Correct UI with actual DB value
             saveVotesToLocalStorage(); // Save corrected state
        }

        console.log("Vote successful for option:", option.id);
        alert("Ovozingiz muvaffaqiyatli qabul qilindi!"); // Success feedback

    } catch (error: any) {
        console.error("Error casting vote:", error);
        errorMsg.value = `Ovoz berishda xatolik: ${error.message}`;

        // Rollback optimistic UI update on error
        option.votes = originalVoteCount;
        votesForCurrentSession.delete(electionId); // Remove vote from session map
        saveVotesToLocalStorage(); // Save rolled-back state

        alert(`Ovoz berishda xatolik yuz berdi.`);

    } finally {
        isLoading.value = false; // Clear global loading indicator
    }
}

// --- Helper Functions ---
function selectElectionToView(election: Election) {
  selectedElection.value = election;
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "Noma'lum";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Noto'g'ri sana";
    return date.toLocaleString('uz-UZ', { // Uzbek locale
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false // 24-hour format
    });
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return "Xato sana formati";
  }
}

// Checks if the *current session* (based on random ID) has voted in the specified election
function userHasVotedInElection(electionId: number): boolean {
    // Check the map for the current session's random ID
    return userVotes.value.get(userId.value)?.has(electionId) ?? false;
}

</script>

<template>
  <div>
    <TheHeader/>

    <div class="md:w-[1280px] w-full mx-auto px-4 py-10 md:pb-44">
      <h1 class="text-2xl sm:text-3xl font-bold text-blue-700 text-center mb-6">
        Saylovlar Ro'yxati
      </h1>

      <!-- Global Loading / Error Messages -->
       <div v-if="isLoading && !elections.length" class="text-center text-gray-500 py-10">
          <svg class="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        Saylovlar yuklanmoqda...
      </div>
       <div v-if="errorMsg" class="text-center text-red-600 bg-red-100 p-3 rounded mb-4 relative">
           Xatolik: {{ errorMsg }}
           <button @click="errorMsg = null" class="absolute top-1 right-2 text-red-800 hover:text-red-900 font-bold text-xl" title="Yopish">×</button>
       </div>


      <!-- Election List -->
      <div v-if="!isLoading || elections.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="election in elections"
          :key="election.id"
          :class="[
            'p-4 sm:p-6 border rounded-lg shadow-sm flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors duration-150',
            { 'bg-blue-50 border-blue-300 ring-2 ring-blue-200': selectedElection?.id === election.id },
            { 'opacity-70': !election.status && selectedElection?.id !== election.id } // Slightly dim inactive ones
          ]"
          @click="selectElectionToView(election)"
          :title="election.status ? election.name : `${election.name} (Nofaol)`"
        >
          <div class="flex-1 min-w-0 mr-3">
            <span class="text-md sm:text-lg font-semibold text-gray-800 block truncate">{{ election.name }}</span>
             <!-- Status Indicator -->
              <span v-if="!election.status" class="text-xs text-red-500 font-medium block mt-1">(Nofaol)</span>
              <span v-else-if="new Date(election.start_data) > currentTime" class="text-xs text-orange-500 font-medium block mt-1">(Boshlanmagan)</span>
              <span v-else-if="new Date(election.end_data) < currentTime" class="text-xs text-gray-500 font-medium block mt-1">(Tugagan)</span>
              <span v-else class="text-xs text-green-600 font-medium block mt-1">(Ovoz Berish Ochiq)</span>
          </div>
          <span class="text-blue-600 text-xl flex-shrink-0">→</span>
        </div>
         <div v-if="elections.length === 0 && !isLoading" class="col-span-full text-center text-gray-500 py-10">
            Hozircha saylovlar mavjud emas.
        </div>
      </div>

      <!-- Selected Election Details & Voting -->
       <div v-if="selectedElection" class="mt-10 p-4 sm:p-6 border rounded-lg shadow-md bg-white" :key="selectedElection.id">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h2 class="text-xl sm:text-2xl font-bold text-gray-800">
            {{ selectedElection.name }}
          </h2>
          <div class="text-xs sm:text-sm text-gray-600 text-left sm:text-right flex-shrink-0">
            <p><strong class="font-medium text-gray-700">Boshlanish:</strong> {{ formatDate(selectedElection.start_data) }}</p>
            <p><strong class="font-medium text-gray-700">Tugash:</strong> {{ formatDate(selectedElection.end_data) }}</p>
            <p><strong class="font-medium text-gray-700">Holat:</strong>
                <span :class="selectedElection.status ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
                    {{ selectedElection.status ? 'Faol' : 'Nofaol' }}
                </span>
                 <!-- Detailed Status -->
                <span v-if="selectedElection.status && new Date(selectedElection.start_data) > currentTime"> (Boshlanmagan)</span>
                <span v-else-if="selectedElection.status && new Date(selectedElection.end_data) < currentTime"> (Tugagan)</span>
                 <span v-else-if="selectedElection.status" class="text-green-600 font-semibold"> (Ochiq)</span>
            </p>
             <p v-if="selectedElection.description" class="mt-1 text-gray-500"><strong>Tavsif:</strong> {{ selectedElection.description }}</p>
          </div>
        </div>

        <!-- Voting Status Banner -->
        <div v-if="userHasVotedInElection(selectedElection.id)" class="text-green-700 text-center p-3 bg-green-50 rounded my-4 text-sm">
            ✅ Siz bu saylovda allaqachon ovoz bergansiz.
        </div>
        <div v-else-if="!isElectionActiveForVoting" class="text-orange-700 text-center p-3 bg-orange-50 rounded my-4 text-sm">
           <!-- More specific inactive reason -->
           <span v-if="!selectedElection.status">Saylov admin tomonidan nofaol qilingan.</span>
           <span v-else-if="new Date(selectedElection.start_data) > currentTime">Ovoz berish hali boshlanmagan ({{ formatDate(selectedElection.start_data) }}).</span>
           <span v-else-if="new Date(selectedElection.end_data) < currentTime">Ovoz berish vaqti tugagan ({{ formatDate(selectedElection.end_data) }}).</span>
           <span v-else>Bu saylov hozirda ovoz berish uchun ochiq emas.</span>
        </div>
        <!-- No banner needed if active and user hasn't voted -->


         <!-- Options List for Voting -->
         <h3 class="text-lg sm:text-xl font-semibold mt-6 mb-3 border-b pb-2 text-gray-700">Nomzodlar Ro'yxati</h3>
         <div v-if="selectedElection.option.length > 0">
            <div class="space-y-3">
                <div v-for="option in selectedElection.option" :key="option.id" class="p-4 border rounded flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-gray-50 transition-colors">
                    <span class="text-md sm:text-lg font-medium text-gray-800">{{ option.name }}</span>

                    <!-- Vote Button: Enabled ONLY if election is active AND user hasn't voted -->
                    <button
                        class="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 text-sm rounded shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 transition-all duration-150"
                        :disabled="!isElectionActiveForVoting || userHasVotedInElection(selectedElection.id) || isLoading"
                        @click="voteForOption(option, selectedElection.id)"
                        :title="userHasVotedInElection(selectedElection.id) ? 'Siz ovoz bergansiz' : !isElectionActiveForVoting ? 'Ovoz berish vaqti emas yoki saylov nofaol' : `Ovoz berish: ${option.name}`"
                    >
                    <span v-if="isLoading && !userHasVotedInElection(selectedElection.id)" class="inline-flex items-center"> {/* Show spinner only if trying to vote */}
                       <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ...
                    </span>
                        <!-- Button Text Logic -->
                        <span v-else-if="userHasVotedInElection(selectedElection.id)">Ovoz Berilgan</span>
                        <span v-else-if="!isElectionActiveForVoting">Yopiq</span>
                        <span v-else>Ovoz Berish</span>
                    </button>
                </div>
            </div>
         </div>
         <div v-else class="text-gray-500 text-center py-4">
            Bu saylov uchun nomzodlar (options) hali qo'shilmagan.
        </div>


        <!-- Vote Results Section -->
        <h3 class="text-lg sm:text-xl font-semibold mt-8 mb-3 border-b pb-2 text-gray-700">
          Ovoz Natijalari
        </h3>
        <div v-if="selectedElection.option.length > 0 && !selectedElection.option.every(opt => typeof opt.votes === 'number')" class="text-red-500 text-sm my-2 p-2 bg-red-50 rounded">
             Natijalarni ko'rsatishda muammo yuz berdi. 'votes' ustuni mavjudligini tekshiring.
        </div>
        <ul v-if="selectedElection.option.length > 0" class="space-y-2 text-sm">
          <li v-for="option in [...selectedElection.option].sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))" :key="option.id" class="flex justify-between items-center bg-gray-50 p-2 rounded shadow-sm">
            <span>{{ option.name }}</span>
             <span class="font-bold text-gray-800">{{ typeof option.votes === 'number' ? option.votes : 'N/A' }}</span>
          </li>
        </ul>
         <div v-else class="text-gray-500 text-center py-4">
            Natijalarni ko'rsatish uchun nomzodlar (options) mavjud emas.
        </div>
      </div>
    </div>
    <!-- Footer -->
     <TheFooter/>
  </div>
</template>

<style>
/* Add any specific styles if needed, Tailwind handles most */
body {
  @apply bg-gray-50;
}
</style>
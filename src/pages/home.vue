<script setup lang="ts">
import { onMounted, ref, reactive } from "vue"; // Added reactive
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://tcvwcyovxfyfijkrahjl.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjdndjeW92eGZ5Zmlqa3JhaGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwNzA0ODEsImV4cCI6MjA1ODY0NjQ4MX0.0uJ4TepuTM6rTmZx4DdaLLGUrUvC6xqvxWh1DcldqIw";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
  status: boolean;
  start_data: string;
  end_data: string;
  created_at?: string;
  updated_at?: string;
  option: Option[];
}

// --- Reactive State ---
const elections = ref<Election[]>([]);
const isLoading = ref(false);
const errorMsg = ref<string | null>(null);

// New Election Form
const newElectionName = ref("");
const newElectionDescription = ref("");
const newElectionStartDate = ref("");
const newElectionEndDate = ref("");

// Selected Election & New Option Form
const newOptionName = ref("");
const selectedElectionForOptions = ref<Election | null>(null);

// UI State
const menuOpen = ref(false);

// Time Edit Modal State
const timeEditModalOpen = ref(false);
const electionForTimeEdit = ref<Partial<Election> & { id: number } | null>(null);

// Election Edit Modal State
const editModalOpen = ref(false);
// Using reactive for the object being edited in the modal
const electionForEdit = reactive<Partial<Election> & { id?: number }>({
    id: undefined,
    name: '',
    description: ''
});


// --- Date Formatting Utilities ---
function formatLocalDateTimeForSupabase(localDateTimeString: string | null | undefined): string | null {
    if (!localDateTimeString) return null;
    try {
        const date = new Date(localDateTimeString);
        if (isNaN(date.getTime())) throw new Error("Invalid Date");
        return date.toISOString();
    } catch (e) {
        console.error("Invalid date format for Supabase:", localDateTimeString, e);
        alert("Sana formati noto'g'ri. Kutilgan format: YYYY-MM-DDTHH:mm");
        return null;
    }
}

function formatISOForLocalDateTimeInput(isoString: string | null | undefined): string {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (e) {
        console.error("Invalid ISO date format for input:", isoString, e);
        return '';
    }
}

function formatDate(isoString: string | null | undefined): string {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' }); // Example Uzbek locale
    } catch (e) {
        return 'Invalid Date';
    }
}

// --- Supabase Operations ---

async function fetchElections() {
  isLoading.value = true;
  errorMsg.value = null;
  selectedElectionForOptions.value = null;
  try {
    const { data, error, status } = await supabase
      .from("election")
      .select(`
        id, name, description, status, start_data, end_data, created_at, updated_at,
        option ( id, name, election_id, created_at, updated_at, votes )
      `)
      .order('created_at', { ascending: false });

    console.log('Fetch Status:', status);
    if (error && status !== 406) { // 406 might indicate an empty table, not necessarily an error
        console.error('Supabase fetch error details:', error);
        throw error;
    }

    if (data) {
      elections.value = data.map(election => ({
        ...election,
        option: (election.option || []).map((opt: any) => ({
          ...opt,
          votes: typeof opt.votes === 'number' ? opt.votes : 0,
        })),
      })) as Election[];
    } else {
      elections.value = []; // Ensure it's an empty array if data is null
    }

  } catch (error: any) {
    console.error("Error fetching elections:", error);
    errorMsg.value = `Saylovlarni yuklashda xatolik: ${error.message}`;
  } finally {
    isLoading.value = false;
  }
}

async function addElection() {
  if (!newElectionName.value.trim()) {
    alert("Iltimos, saylov nomini kiriting."); return;
  }
  if (!newElectionStartDate.value || !newElectionEndDate.value) {
      alert("Iltimos, boshlanish va tugash vaqtlarini kiriting."); return;
  }
  const startDateISO = formatLocalDateTimeForSupabase(newElectionStartDate.value);
  const endDateISO = formatLocalDateTimeForSupabase(newElectionEndDate.value);
  if (!startDateISO || !endDateISO) return;
  if (new Date(startDateISO) >= new Date(endDateISO)) {
    alert("Tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak."); return;
  }

  isLoading.value = true;
  errorMsg.value = null;
  try {
    const { data, error } = await supabase
      .from("election")
      .insert([{
        name: newElectionName.value.trim(),
        description: newElectionDescription.value.trim() || null,
        status: false,
        start_data: startDateISO,
        end_data: endDateISO,
      }])
      .select() // Select the inserted row to get its ID etc.
      .single();

    if (error) throw error;

    // Add the new election to the top of the list locally
    if (data) {
         const newElection: Election = {
            ...(data as Omit<Election, 'option'>), // Cast Supabase response
            option: [], // Initialize options array
            // Ensure votes is handled if needed directly on election, though unlikely
        };
        elections.value.unshift(newElection); // Add to beginning
    } else {
        // Fallback: Re-fetch if insert succeeded but didn't return data (shouldn't happen with .select())
         await fetchElections();
    }


    newElectionName.value = "";
    newElectionDescription.value = "";
    newElectionStartDate.value = "";
    newElectionEndDate.value = "";

  } catch (error: any) {
    console.error("Error adding election:", error);
    errorMsg.value = `Saylov qo'shishda xatolik: ${error.message}`;
  } finally {
    isLoading.value = false;
  }
}

async function removeElection(electionId: number) {
  // Find the election name for the confirmation message
  const electionName = elections.value.find(e => e.id === electionId)?.name || `ID ${electionId}`;
  if (!confirm(`Haqiqatan ham "${electionName}" saylovini (va unga bog'liq nomzodlarni/options) o'chirmoqchimisiz?\nBu amalni qaytarib bo'lmaydi!`)) return;

  isLoading.value = true;
  errorMsg.value = null;
  try {
    // IMPORTANT: Ensure cascade delete is set up in Supabase (election -> option)
    // or delete options manually first:
    // const { error: optionError } = await supabase.from("option").delete().eq("election_id", electionId);
    // if (optionError) throw optionError;

    const { error } = await supabase.from("election").delete().eq("id", electionId);
    if (error) throw error;

    // Update local state immediately
    const indexToRemove = elections.value.findIndex(e => e.id === electionId);
    if (indexToRemove > -1) {
      elections.value.splice(indexToRemove, 1);
    }

    // If the deleted election was selected, deselect it
    if (selectedElectionForOptions.value?.id === electionId) {
        selectedElectionForOptions.value = null;
    }

  } catch (error: any) {
    console.error("Error removing election:", error);
    errorMsg.value = `Saylovni ("${electionName}") o'chirishda xatolik: ${error.message}. Agar nomzodlar (options) mavjud bo'lsa, avval ularni o'chiring yoki bazada cascade delete sozlanmagan bo'lishi mumkin.`;
  } finally {
      isLoading.value = false;
  }
}

async function toggleElectionStatus(election: Election) {
  isLoading.value = true;
  errorMsg.value = null;
  try {
    const newStatus = !election.status;
    const { error } = await supabase
      .from("election")
      .update({ status: newStatus })
      .eq("id", election.id);

    if (error) throw error;
    // Update local state directly
    election.status = newStatus;

  } catch (error: any) {
    console.error("Error toggling election status:", error);
    errorMsg.value = `Holatni o'zgartirishda xatolik: ${error.message}`;
  } finally {
      isLoading.value = false;
  }
}

function selectElection(election: Election) {
  selectedElectionForOptions.value = election;
  newOptionName.value = "";
}

async function addOption() {
  if (!selectedElectionForOptions.value) {
    alert("Iltimos, avval nomzod (option) qo'shish uchun saylovni tanlang."); return;
  }
  if (!newOptionName.value.trim()) {
    alert("Iltimos, nomzod (option) nomini kiriting."); return;
  }

  isLoading.value = true;
  errorMsg.value = null;
  try {
    const { data, error } = await supabase
      .from("option")
      .insert([{
        name: newOptionName.value.trim(),
        election_id: selectedElectionForOptions.value.id,
        // votes defaults to 0 in DB or is set by trigger/policy
      }])
      .select()
      .single();

    if (error) throw error;

    // ****** CORRECTED BLOCK ******
    if (data && selectedElectionForOptions.value) {
        const newOption: Option = {
            id: data.id,
            name: data.name,
            election_id: data.election_id,
            votes: data.votes ?? 0, // Default votes to 0 if null/undefined
            created_at: data.created_at,
            updated_at: data.updated_at,
        };
        // Add ONLY to the selected election's options list.
        // Vue's reactivity handles updating the view.
        selectedElectionForOptions.value.option.push(newOption);
    }
    // ****** END CORRECTED BLOCK ******

    newOptionName.value = "";

  } catch (error: any) {
    console.error("Error adding option:", error);
    errorMsg.value = `Nomzod (Option) qo'shishda xatolik: ${error.message}`;
  } finally {
      isLoading.value = false;
  }
}

async function removeOption(optionId: number, electionId: number) {
   // Find the option name for the confirmation message
    const election = elections.value.find(e => e.id === electionId);
    const optionName = election?.option.find(o => o.id === optionId)?.name || `ID ${optionId}`;

    if (!confirm(`Haqiqatan ham "${optionName}" nomzodini (option) o'chirmoqchimisiz?`)) return;

  isLoading.value = true;
  errorMsg.value = null;
  try {
    const { error } = await supabase.from("option").delete().eq("id", optionId);
    if (error) throw error;

    // Update local state for selected election
    if (selectedElectionForOptions.value && selectedElectionForOptions.value.id === electionId) {
        const optionIndex = selectedElectionForOptions.value.option.findIndex(o => o.id === optionId);
        if(optionIndex > -1) {
            selectedElectionForOptions.value.option.splice(optionIndex, 1);
        }
    }
    // Update local state for main elections array
    const electionIndex = elections.value.findIndex(e => e.id === electionId);
    if (electionIndex !== -1) {
        const optionIndexInMain = elections.value[electionIndex].option.findIndex(o => o.id === optionId);
         if(optionIndexInMain > -1) {
            // This splice might be redundant if selectedElectionForOptions refers to the same object,
            // but it ensures consistency if they were somehow different references.
            elections.value[electionIndex].option.splice(optionIndexInMain, 1);
        }
    }

  } catch (error: any) {
    console.error("Error removing option:", error);
    errorMsg.value = `Nomzodni ("${optionName}") o'chirishda xatolik: ${error.message}`;
  } finally {
      isLoading.value = false;
  }
}

// --- Time Edit Modal Functions ---
function openTimeEditModal(election: Election) {
  electionForTimeEdit.value = {
      id: election.id,
      name: election.name,
      start_data: formatISOForLocalDateTimeInput(election.start_data),
      end_data: formatISOForLocalDateTimeInput(election.end_data),
  };
  timeEditModalOpen.value = true;
}

function closeTimeEditModal() {
  timeEditModalOpen.value = false;
  electionForTimeEdit.value = null;
}

async function saveTimeChanges() {
  if (!electionForTimeEdit.value) return;
  if (!electionForTimeEdit.value.start_data || !electionForTimeEdit.value.end_data) {
      alert("Iltimos, boshlanish va tugash vaqtlarini kiriting."); return;
  }
  const startDateISO = formatLocalDateTimeForSupabase(electionForTimeEdit.value.start_data);
  const endDateISO = formatLocalDateTimeForSupabase(electionForTimeEdit.value.end_data);
  if (!startDateISO || !endDateISO) return;
  if (new Date(startDateISO) >= new Date(endDateISO)) {
    alert("Tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak."); return;
  }

  isLoading.value = true;
  errorMsg.value = null;
  try {
    const { error } = await supabase
      .from("election")
      .update({
        start_data: startDateISO,
        end_data: endDateISO,
      })
      .eq("id", electionForTimeEdit.value.id);

    if (error) throw error;

    // Update local state
    const index = elections.value.findIndex(e => e.id === electionForTimeEdit.value!.id);
    if (index !== -1) {
        elections.value[index].start_data = startDateISO;
        elections.value[index].end_data = endDateISO;
        // If this election is currently selected, update its times too
        if (selectedElectionForOptions.value?.id === electionForTimeEdit.value.id) {
            selectedElectionForOptions.value.start_data = startDateISO;
            selectedElectionForOptions.value.end_data = endDateISO;
        }
    }
    closeTimeEditModal();

  } catch (error: any) {
    console.error("Error updating election time:", error);
    errorMsg.value = `Vaqtni yangilashda xatolik: ${error.message}`;
  } finally {
      isLoading.value = false;
  }
}

// --- Election Edit Modal Functions ---
function openEditModal(election: Election) {
    // Use Object.assign to update the reactive object's properties
    Object.assign(electionForEdit, {
        id: election.id,
        name: election.name,
        description: election.description || '' // Ensure description is not undefined
    });
    editModalOpen.value = true;
}

function closeEditModal() {
    editModalOpen.value = false;
    // Reset the reactive object
    Object.assign(electionForEdit, { id: undefined, name: '', description: '' });
}

async function saveElectionChanges() {
    if (!electionForEdit.id || !electionForEdit.name?.trim()) {
        alert("Saylov nomi bo'sh bo'lishi mumkin emas.");
        return;
    }

    isLoading.value = true;
    errorMsg.value = null;
    try {
        const { error } = await supabase
            .from("election")
            .update({
                name: electionForEdit.name.trim(),
                description: electionForEdit.description?.trim() || null, // Send null if empty
            })
            .eq("id", electionForEdit.id);

        if (error) throw error;

        // Update local state
        const index = elections.value.findIndex(e => e.id === electionForEdit.id);
        if (index !== -1) {
            elections.value[index].name = electionForEdit.name.trim();
            elections.value[index].description = electionForEdit.description?.trim() || undefined; // Match interface

             // If this election is currently selected, update its details too
            if (selectedElectionForOptions.value?.id === electionForEdit.id) {
                selectedElectionForOptions.value.name = electionForEdit.name.trim();
                selectedElectionForOptions.value.description = electionForEdit.description?.trim() || undefined;
            }
        }
        closeEditModal();

    } catch (error: any) {
        console.error("Error updating election details:", error);
        errorMsg.value = `Saylovni tahrirlashda xatolik: ${error.message}`;
    } finally {
        isLoading.value = false;
    }
}


// Fetch initial data when component mounts
onMounted(fetchElections);

</script>

<template>
  <div class="min-h-screen bg-gray-100">
     <header class="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md py-4 sticky top-0 z-10">
       <div class="container mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8">
         <h1 class="text-2xl sm:text-3xl font-extrabold text-white">Saylov Admin Paneli</h1>
         <button class="sm:hidden text-white focus:outline-none" @click="menuOpen = !menuOpen">☰</button>
       </div>
       <div v-if="menuOpen" class="sm:hidden bg-indigo-700 p-4">
         <!-- Add mobile nav links here if needed -->
          <button class="block text-white text-sm font-medium py-2 w-full text-left" @click="menuOpen = false">Yopish</button>
       </div>
     </header>

    <main class="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <!-- Loading Indicator -->
        <div v-if="isLoading" class="fixed top-16 left-1/2 transform -translate-x-1/2 bg-blue-100 text-blue-700 p-2 rounded shadow z-50 flex items-center gap-2">
            <svg class="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Amal bajarilmoqda...
        </div>
        <!-- Error Message -->
        <div v-if="errorMsg" class="mb-4 p-3 bg-red-100 text-red-700 rounded shadow relative">
            Xatolik: {{ errorMsg }}
            <button @click="errorMsg = null" class="absolute top-1 right-2 text-red-800 hover:text-red-900 font-bold text-xl">×</button>
        </div>

      <!-- Add New Election Form -->
      <div class="bg-white p-6 rounded-lg shadow mb-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Yangi Saylov Qo'shish</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
                <label for="newElectionName" class="block text-sm font-medium text-gray-700">Nomi</label>
                <input id="newElectionName" v-model="newElectionName" type="text" required class="mt-1 input-field" placeholder="Saylov nomi (masalan, Fakultet Dekani)">
           </div>
            <div>
                <label for="newElectionDesc" class="block text-sm font-medium text-gray-700">Tavsifi (ixtiyoriy)</label>
                <input id="newElectionDesc" v-model="newElectionDescription" type="text" class="mt-1 input-field" placeholder="Qisqacha izoh">
           </div>
           <div>
                <label for="newElectionStart" class="block text-sm font-medium text-gray-700">Boshlanish vaqti</label>
                <input id="newElectionStart" v-model="newElectionStartDate" type="datetime-local" required class="mt-1 input-field">
           </div>
           <div>
                <label for="newElectionEnd" class="block text-sm font-medium text-gray-700">Tugash vaqti</label>
                <input id="newElectionEnd" v-model="newElectionEndDate" type="datetime-local" required class="mt-1 input-field">
           </div>
        </div>
        <button
            class="mt-4 btn btn-primary" @click="addElection"
            :disabled="isLoading || !newElectionName || !newElectionStartDate || !newElectionEndDate" >
          <svg v-if="isLoading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          Saylov Qo'shish
        </button>
      </div>

      <!-- Existing Elections List -->
      <h2 class="text-3xl font-bold text-gray-900 mb-6">Mavjud Saylovlar</h2>
      <div v-if="!isLoading && elections.length === 0" class="text-center text-gray-500 py-5 bg-white rounded shadow">Saylovlar mavjud emas.</div>
      <ul v-else class="bg-white divide-y divide-gray-200 rounded-lg shadow overflow-hidden">
        <li v-for="(election, index) in elections" :key="election.id" class="hover:bg-gray-50 transition-colors duration-150">
          <div class="px-4 py-4 sm:px-6">
             <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div class="flex-1 min-w-0">
                    <!-- Make election name clickable to show options -->
                    <button class="text-lg font-semibold text-indigo-600 hover:text-indigo-800 truncate focus:outline-none focus:underline text-left"
                         @click="selectElection(election)" :title="`Nomzodlarni ko'rish/qo'shish: ${election.name}`">
                        {{ index + 1 }}. {{ election.name }}
                    </button>
                     <p v-if="election.description" class="text-sm text-gray-600 mt-1 truncate">{{ election.description }}</p>
                    <div class="mt-2 text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1 items-center">
                        <span>ID: {{ election.id }}</span>
                         <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                               :class="election.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                            {{ election.status ? 'Faol' : 'Nofaol' }}
                        </span>
                        <span><strong class="font-medium text-gray-600">Boshlanish:</strong> {{ formatDate(election.start_data) }}</span>
                        <span><strong class="font-medium text-gray-600">Tugash:</strong> {{ formatDate(election.end_data) }}</span>
                    </div>
                </div>
                <!-- Action Buttons -->
                <div class="flex-shrink-0 flex flex-wrap gap-2 justify-start sm:justify-end items-center">
                   <button class="btn btn-sm" :class=" election.status ? 'btn-warning-outline' : 'btn-success-outline'"
                        @click="toggleElectionStatus(election)" :disabled="isLoading" :title="election.status ? 'Saylovni nofaol qilish' : 'Saylovni faol qilish'">
                        {{ election.status ? 'Nofaol qilish' : 'Faol qilish' }}
                    </button>
                     <button class="btn btn-sm btn-secondary-outline" @click="openEditModal(election)" :disabled="isLoading" title="Saylov nomini/tavsifini tahrirlash">
                        Tahrirlash
                    </button>
                    <button class="btn btn-sm btn-info-outline" @click="openTimeEditModal(election)" :disabled="isLoading" title="Saylov vaqtini o'zgartirish">
                        Vaqtni o‘zgartirish
                    </button>
                    <button class="btn btn-sm btn-danger-outline" @click="removeElection(election.id)" :disabled="isLoading" title="Saylovni o'chirish">
                        O‘chirish
                    </button>
                </div>
             </div>
          </div>
        </li>
      </ul>

      <!-- Options Section (Appears when an election is selected) -->
      <div v-if="selectedElectionForOptions" class="mt-10 bg-white p-6 rounded-lg shadow" :key="selectedElectionForOptions.id"> <!-- Add key for reactivity -->
        <h2 class="text-2xl font-bold text-gray-800 mb-5 flex justify-between items-center">
          <span><span class="text-indigo-600 font-semibold">{{ selectedElectionForOptions.name }}</span> uchun Nomzodlar (Options)</span>
           <button @click="selectedElectionForOptions = null" class="text-gray-400 hover:text-gray-600 text-2xl font-bold" title="Yopish">×</button>
        </h2>

        <!-- Add New Option Form -->
        <div class="mb-6 flex flex-col sm:flex-row items-end gap-3">
          <div class="flex-grow w-full sm:w-auto">
             <label :for="'newOptionName' + selectedElectionForOptions.id" class="block text-sm font-medium text-gray-700">Yangi nomzod (option) nomi</label>
             <input :id="'newOptionName' + selectedElectionForOptions.id" v-model="newOptionName"
                class="mt-1 input-field" placeholder="Nomzod Ismi yoki Option Nomi" @keyup.enter="addOption" >
          </div>
          <button class="btn btn-success whitespace-nowrap w-full sm:w-auto" @click="addOption"
            :disabled="isLoading || !newOptionName.trim()">
             <svg v-if="isLoading && selectedElectionForOptions" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Option Qo‘shish
          </button>
        </div>

        <!-- List of Existing Options -->
        <h3 class="text-xl font-semibold mb-3 border-b pb-2">Mavjud Nomzodlar (Options)</h3>
        <div v-if="!isLoading && selectedElectionForOptions.option.length === 0" class="text-center text-gray-500 py-4">Bu saylov uchun options hali qo'shilmagan.</div>
        <ul v-else class="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          <li v-for="(option, index) in selectedElectionForOptions.option" :key="option.id"
            class="py-3 flex items-center justify-between hover:bg-gray-50 px-2" >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900">{{ index + 1 }}. {{ option.name }}</p>
              <p class="mt-1 text-xs text-gray-500">
                <span class="font-semibold">{{ option.votes }}</span> ta ovoz (ID: {{ option.id }})
              </p>
            </div>
            <button class="btn btn-xs btn-danger-outline flex-shrink-0 ml-4" @click="removeOption(option.id, selectedElectionForOptions.id)" :disabled="isLoading" title="Nomzodni o'chirish">
              O‘chirish
            </button>
          </li>
        </ul>
      </div>
    </main>

    <!-- Edit Election Modal -->
     <div v-if="editModalOpen" class="fixed z-30 inset-0 overflow-y-auto" aria-labelledby="edit-modal-title" role="dialog" aria-modal="true">
       <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
         <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="closeEditModal"></div>
         <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">​</span>
         <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
           <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
             <div class="sm:flex sm:items-start">
                <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg class="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"> <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /> </svg>
                 </div>
               <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                 <h3 id="edit-modal-title" class="text-lg leading-6 font-medium text-gray-900">
                   Saylovni Tahrirlash
                 </h3>
                 <div class="mt-4 space-y-4">
                   <div>
                     <label for="editElectionNameModal" class="block text-sm font-medium text-gray-700">Saylov Nomi</label>
                     <input id="editElectionNameModal" v-model="electionForEdit.name" type="text" required class="mt-1 input-field">
                   </div>
                   <div>
                     <label for="editElectionDescModal" class="block text-sm font-medium text-gray-700">Tavsifi (ixtiyoriy)</label>
                     <textarea id="editElectionDescModal" v-model="electionForEdit.description" rows="3" class="mt-1 input-field" placeholder="Qisqacha izoh"></textarea>
                   </div>
                 </div>
               </div>
             </div>
           </div>
           <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
             <button type="button" class="btn btn-primary w-full sm:ml-3 sm:w-auto sm:text-sm" @click="saveElectionChanges"
                :disabled="isLoading || !electionForEdit.name?.trim()">
               <svg v-if="isLoading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
               Saqlash
             </button>
             <button type="button" class="btn btn-secondary mt-3 w-full sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" @click="closeEditModal" :disabled="isLoading">
               Bekor qilish
             </button>
           </div>
         </div>
       </div>
     </div>
     <!-- End Edit Election Modal -->

    <!-- Time Edit Modal -->
     <div v-if="timeEditModalOpen" class="fixed z-20 inset-0 overflow-y-auto" aria-labelledby="time-modal-title" role="dialog" aria-modal="true">
       <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
         <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="closeTimeEditModal"></div>
         <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">​</span>
         <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
           <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
             <div class="sm:flex sm:items-start">
                <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                     <svg class="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 </div>
               <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                 <h3 id="time-modal-title" class="text-lg leading-6 font-medium text-gray-900">
                   Vaqtni o‘zgartirish: {{ electionForTimeEdit?.name }}
                 </h3>
                 <div class="mt-4 space-y-4">
                   <div>
                     <label for="boshlanishVaqtiModal" class="block text-sm font-medium text-gray-700">Boshlanish vaqti</label>
                     <input id="boshlanishVaqtiModal" v-model="electionForTimeEdit!.start_data" type="datetime-local" required class="mt-1 input-field">
                   </div>
                   <div>
                     <label for="tugashVaqtiModal" class="block text-sm font-medium text-gray-700">Tugash vaqti</label>
                     <input id="tugashVaqtiModal" v-model="electionForTimeEdit!.end_data" type="datetime-local" required class="mt-1 input-field">
                   </div>
                 </div>
               </div>
             </div>
           </div>
           <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
             <button type="button" class="btn btn-primary w-full sm:ml-3 sm:w-auto sm:text-sm" @click="saveTimeChanges"
                :disabled="isLoading || !electionForTimeEdit?.start_data || !electionForTimeEdit?.end_data">
               <svg v-if="isLoading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
               Saqlash
             </button>
             <button type="button" class="btn btn-secondary mt-3 w-full sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" @click="closeTimeEditModal" :disabled="isLoading">
               Bekor qilish
             </button>
           </div>
         </div>
       </div>
     </div>
     <!-- End Time Edit Modal -->

  </div>
</template>

<style>
.input-field {
    @apply shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full border-gray-300 rounded-md px-3 py-2 text-sm; /* Adjusted text size */
}
.btn {
    @apply inline-flex justify-center items-center border border-transparent rounded-md shadow-sm px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150;
}
.btn-sm { @apply px-3 py-1.5 text-xs; }
.btn-xs { @apply px-2.5 py-1 text-xs; }

/* Solid Buttons */
.btn-primary { @apply text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500; }
.btn-secondary { @apply text-gray-700 bg-white hover:bg-gray-50 border-gray-300 focus:ring-indigo-500; }
.btn-danger { @apply text-white bg-red-600 hover:bg-red-700 focus:ring-red-500; }
.btn-warning { @apply text-gray-800 bg-yellow-400 hover:bg-yellow-500 focus:ring-yellow-300; }
.btn-success { @apply text-white bg-green-600 hover:bg-green-700 focus:ring-green-500; }
.btn-info { @apply text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500; }

/* Outline Buttons (Added for action buttons in list) */
.btn-outline {
     @apply bg-transparent border focus:ring-offset-0;
}
.btn-warning-outline { @apply btn-outline border-yellow-500 text-yellow-600 hover:bg-yellow-50 focus:ring-yellow-400; }
.btn-success-outline { @apply btn-outline border-green-500 text-green-600 hover:bg-green-50 focus:ring-green-400; }
.btn-info-outline { @apply btn-outline border-blue-500 text-blue-600 hover:bg-blue-50 focus:ring-blue-400; }
.btn-danger-outline { @apply btn-outline border-red-500 text-red-600 hover:bg-red-50 focus:ring-red-400; }
.btn-secondary-outline { @apply btn-outline border-gray-400 text-gray-600 hover:bg-gray-50 focus:ring-indigo-400; } /* Example for generic edit */


/* Loading Indicator Transition */
.fixed.top-16 {
    transition: opacity 0.3s ease-in-out;
}

/* Style scrollbar for options list */
.max-h-96::-webkit-scrollbar {
  width: 6px;
}
.max-h-96::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}
.max-h-96::-webkit-scrollbar-thumb {
  background: #c5c5c5;
  border-radius: 10px;
}
.max-h-96::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
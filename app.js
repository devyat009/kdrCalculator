function renderRealisticTargets(targetKdr) {
	const table = document.getElementById('realistic-targets');
	if (!table) return;
	table.innerHTML = '';

	const mediumTarget = parseDecimalInput(mediumInput.value);
	const kdrTarget = Number.isFinite(mediumTarget) && mediumTarget > 0 ? mediumTarget : 4.0;

	const icons = [
		'swords', // 20 kills
		'flag',   // 24 kills
		'bolt',   // 28 kills
		'star',   // 32 kills
		'shield', // 36 kills
		'leaderboard', // 40 kills
	];

	for (let i = 0, kills = 20; kills <= 40; kills += 4, i++) {
		const deaths = Math.floor(kills / kdrTarget);
		const kdr = deaths > 0 ? kills / deaths : 0;
		const icon = icons[i] || 'sports_esports';
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td class="icon-cell"><span class="material-symbols-outlined" style="font-size:1.3em;vertical-align:middle;">${icon}</span></td>
			<td>${kills}</td>
			<td>${deaths}</td>
			<td>${kdr.toFixed(2)}</td>
		`;
		table.appendChild(tr);
	}
}
// Hide loading overlay after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
	const loading = document.getElementById('kdr-loading-overlay');
	if (loading) {
		loading.classList.add('is-hidden');
		setTimeout(() => loading.remove(), 1000);
	}
});
const STORAGE_KEY = 'kdr-history';
const LIMIT_KEY = 'kdr-history-limit';
const BASE_KEY = 'kdr-base';
const SETTINGS_KEY = 'kdr-settings';

const form = document.getElementById('kdr-form');
const killsInput = document.getElementById('kills');
const deathsInput = document.getElementById('deaths');
const nextInput = document.getElementById('next-kdr');
const mediumInput = document.getElementById('medium-kdr');
const historyLimitInput = document.getElementById('history-limit');
const baseKillsInput = document.getElementById('base-kills');
const baseDeathsInput = document.getElementById('base-deaths');
const setBaseBtn = document.getElementById('set-base-from-current');
const swapBaseBtn = document.getElementById('swap-base-current');
const currentKdrEl = document.getElementById('current-kdr');
const currentDeltaEl = document.getElementById('current-kdr-delta');
const nextKillsEl = document.getElementById('next-kills');
const mediumKillsEl = document.getElementById('medium-kills');
const currentNextEl = document.getElementById('current-next');
const historyList = document.getElementById('history-list');
const downloadBtn = document.getElementById('download-history');
const importInput = document.getElementById('import-history');
const clearBtn = document.getElementById('clear-history');
const snackbarContainer = document.getElementById('snackbar-container');
const confirmSwapBtn = document.getElementById('confirm-swap');

function updateSetBaseButtonState() {
	if (!setBaseBtn) return;
	const hasKills = baseKillsInput?.value !== '' && Number.isFinite(Number(baseKillsInput.value));
	const hasDeaths = baseDeathsInput?.value !== '' && Number.isFinite(Number(baseDeathsInput.value));
	setBaseBtn.disabled = !(hasKills && hasDeaths);
}

const integerFormatter = new Intl.NumberFormat('pt-BR', {
	maximumFractionDigits: 0,
});

function formatKdr(value) {
	if (!Number.isFinite(value)) return '∞';
	const raw = value.toString();
	return raw.replace('.', ',');
}

function formatInteger(value) {
	return integerFormatter.format(Math.max(0, Math.ceil(value)));
}

function formatKdrFixed(value, digits = 6) {
	if (!Number.isFinite(value)) return '∞';
	return value.toFixed(digits).replace('.', ',');
}

function parseDecimalInput(value) {
	const normalized = String(value ?? '').trim().replace(',', '.');
	if (!normalized) return NaN;
	return Number(normalized);
}

function formatDecimalInput(value, digits = 4) {
	if (!Number.isFinite(value)) return '';
	return value.toFixed(digits).replace('.', ',');
}

function showSnackbar(message, type = 'info') {
	if (!snackbarContainer) return;
	const snackbar = document.createElement('div');
	snackbar.className = `snackbar ${type}`;
	snackbar.textContent = message;
	snackbarContainer.appendChild(snackbar);
	requestAnimationFrame(() => snackbar.classList.add('show'));

	setTimeout(() => {
		snackbar.classList.remove('show');
		setTimeout(() => snackbar.remove(), 200);
	}, 3000);
}

let swapPendingTimeoutId = null;

function setSwapPending(isPending) {
	if (!confirmSwapBtn) return;
	confirmSwapBtn.classList.toggle('is-hidden', !isPending);
	confirmSwapBtn.disabled = !isPending;
	if (swapPendingTimeoutId) {
		clearTimeout(swapPendingTimeoutId);
		swapPendingTimeoutId = null;
	}
	if (isPending) {
		swapPendingTimeoutId = setTimeout(() => setSwapPending(false), 10000);
	}
}

function getLimit() {
	const stored = Number(localStorage.getItem(LIMIT_KEY));
	if (Number.isFinite(stored) && stored > 0) {
		return stored;
	}
	return 10;
}

function setLimit(value) {
	const limit = Math.max(1, Math.floor(value || 10));
	localStorage.setItem(LIMIT_KEY, String(limit));
	historyLimitInput.value = limit;
	return limit;
}

function loadHistory() {
	const stored = localStorage.getItem(STORAGE_KEY);
	if (!stored) return [];
	try {
		const parsed = JSON.parse(stored);
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		return [];
	}
}

function loadBase() {
	const stored = localStorage.getItem(BASE_KEY);
	if (!stored) return { kills: 0, deaths: 0 };
	try {
		const parsed = JSON.parse(stored);
		return {
			kills: Number(parsed.kills) || 0,
			deaths: Number(parsed.deaths) || 0,
		};
	} catch (error) {
		return { kills: 0, deaths: 0 };
	}
}

function loadSettings() {
	const stored = localStorage.getItem(SETTINGS_KEY);
	if (!stored) return {};
	try {
		const parsed = JSON.parse(stored);
		return parsed && typeof parsed === 'object' ? parsed : {};
	} catch (error) {
		return {};
	}
}

function saveBase(kills, deaths) {
	localStorage.setItem(
		BASE_KEY,
		JSON.stringify({
			kills: Math.max(0, Math.floor(kills || 0)),
			deaths: Math.max(0, Math.floor(deaths || 0)),
		}),
	);
}

function saveSettings({ kills, deaths, nextTarget, mediumTarget }) {
	localStorage.setItem(
		SETTINGS_KEY,
		JSON.stringify({
			kills: Number.isFinite(kills) ? Math.max(0, Math.floor(kills)) : null,
			deaths: Number.isFinite(deaths) ? Math.max(0, Math.floor(deaths)) : null,
			nextTarget: Number.isFinite(nextTarget) ? nextTarget : null,
			mediumTarget: Number.isFinite(mediumTarget) ? mediumTarget : null,
		}),
	);
}

function saveHistory(history) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function calculateKdr(kills, deaths) {
	if (!Number.isFinite(kills) || !Number.isFinite(deaths)) return 0;
	if (deaths === 0) return kills > 0 ? Infinity : 0;
	return kills / deaths;
}

function killsNeededForTarget(kills, deaths, target) {
	if (!Number.isFinite(target) || target <= 0) return 0;
	if (deaths === 0) return 0;
	const needed = target * deaths - kills;
	return Math.max(0, Math.ceil(needed));
}

function updateTargets(kills, deaths) {
	const nextTarget = parseDecimalInput(nextInput.value);
	const mediumTarget = parseDecimalInput(mediumInput.value);

	nextKillsEl.textContent = formatInteger(killsNeededForTarget(kills, deaths, nextTarget));
	mediumKillsEl.textContent = formatInteger(killsNeededForTarget(kills, deaths, mediumTarget));
	updateNextKdrStatus(kills, deaths, nextTarget, calculateKdr(kills, deaths));
	renderRealisticTargets(nextTarget);
}

function updateNextKdrStatus(kills, deaths, nextTarget, currentKdr) {
	if (!currentNextEl) return;
	if (!Number.isFinite(nextTarget) || nextTarget <= 0) {
		currentNextEl.textContent = 'Set a target to see the next KDR.';
		return;
	}
	const delta = Math.max(0, nextTarget - currentKdr);
	if (delta === 0) {
		currentNextEl.textContent = `You already reached KDR ${formatKdr(nextTarget)}.`;
		return;
	}
	currentNextEl.textContent = `${formatKdrFixed(delta)} KDR remaining to reach ${formatKdr(nextTarget)}.`;
}

function updateCurrentDisplay(current, baseValue) {
	currentKdrEl.textContent = formatKdr(current);
	currentDeltaEl.classList.remove('delta-up', 'delta-down', 'delta-neutral');

	const arrow = currentDeltaEl.querySelector('.arrow');
	const text = currentDeltaEl.querySelector('.delta-text');

	if (!Number.isFinite(baseValue) && !Number.isFinite(current)) {
		currentDeltaEl.classList.add('delta-neutral');
		arrow.textContent = '→';
		text.textContent = 'No changes yet';
		return;
	}

	if (baseValue === null || baseValue === undefined) {
		currentDeltaEl.classList.add('delta-neutral');
		arrow.textContent = '→';
		text.textContent = 'No changes yet';
		return;
	}

	if (current > baseValue) {
		currentDeltaEl.classList.add('delta-up');
		arrow.textContent = '↑';
		text.textContent = 'Increased';
	} else if (current < baseValue) {
		currentDeltaEl.classList.add('delta-down');
		arrow.textContent = '↓';
		text.textContent = 'Decreased';
	} else {
		currentDeltaEl.classList.add('delta-neutral');
		arrow.textContent = '→';
		text.textContent = 'No change';
	}
}

function renderHistory(history) {
	historyList.innerHTML = '';

	const base = loadBase();
	const baseKdr = calculateKdr(base.kills, base.deaths);
	const currentKills = Number(killsInput.value);
	const currentDeaths = Number(deathsInput.value);
	const hasCurrentInputs = killsInput.value.trim() !== '' && deathsInput.value.trim() !== '' && Number.isFinite(currentKills) && Number.isFinite(currentDeaths);
	const latest = history[0];
	const currentKdr = hasCurrentInputs
		? calculateKdr(currentKills, currentDeaths)
		: latest
			? latest.kdr
			: (baseKdr > 0 ? baseKdr : 0);

	if (!history.length) {
		const empty = document.createElement('p');
		empty.className = 'empty';
		empty.textContent = 'No calculations yet.';
		historyList.appendChild(empty);
		updateCurrentDisplay(currentKdr, baseKdr);
		return;
	}

	updateCurrentDisplay(currentKdr, baseKdr);

	history.forEach((item, index) => {
		const wrapper = document.createElement('div');
		wrapper.className = 'history-item';

		const info = document.createElement('div');
		info.className = 'history-info';

		const kdrLine = document.createElement('div');
		kdrLine.className = 'history-kdr';
		kdrLine.textContent = formatKdr(item.kdr);

		const meta = document.createElement('div');
		meta.className = 'history-meta';
		meta.textContent = `Kills ${integerFormatter.format(item.kills)} · Deaths ${integerFormatter.format(item.deaths)} · ${new Date(item.timestamp).toLocaleString('pt-BR')}`;

		info.appendChild(kdrLine);
		info.appendChild(meta);

		const delta = document.createElement('div');
		const previousItem = history[index + 1];
		let deltaClass = 'delta-neutral';
		let deltaText = '→';
		if (previousItem) {
			if (item.kdr > previousItem.kdr) {
				deltaClass = 'delta-up';
				deltaText = '↑';
			} else if (item.kdr < previousItem.kdr) {
				deltaClass = 'delta-down';
				deltaText = '↓';
			}
		}
		delta.className = `history-kdr ${deltaClass}`;
		delta.textContent = deltaText;

		wrapper.appendChild(info);
		wrapper.appendChild(delta);
		historyList.appendChild(wrapper);
	});
}

function addCalculation(kills, deaths) {
	const kdr = calculateKdr(kills, deaths);
	const history = loadHistory();
	const newEntry = {
		kills,
		deaths,
		kdr,
		timestamp: Date.now(),
	};
	history.unshift(newEntry);
	const limit = getLimit();
	const trimmed = history.slice(0, limit);
	saveHistory(trimmed);
	const nextTarget = parseDecimalInput(nextInput.value);
	const mediumTarget = parseDecimalInput(mediumInput.value);
	saveSettings({
		kills,
		deaths,
		nextTarget,
		mediumTarget,
	});
	renderHistory(trimmed);
}

function updateLiveOutputs() {
	updateSetBaseButtonState();
	if (killsInput.value.trim() === '' || deathsInput.value.trim() === '') {
		renderHistory(loadHistory());
		return;
	}
	const kills = Number(killsInput.value);
	const deaths = Number(deathsInput.value);
	if (!Number.isFinite(kills) || !Number.isFinite(deaths)) {
		renderHistory(loadHistory());
		return;
	}
	const kdr = calculateKdr(kills, deaths);
	const base = loadBase();
	const baseKdr = calculateKdr(base.kills, base.deaths);
	updateCurrentDisplay(kdr, baseKdr);
	updateTargets(kills, deaths);
}

function downloadHistory() {
	const history = loadHistory();
	if (!history.length) {
		showSnackbar('No history to download.', 'error');
		return;
	}
	const base = loadBase();
	const settings = loadSettings();
	const latest = history[0];
	const savedKills = Number.isFinite(settings.kills) ? settings.kills : latest.kills;
	const savedDeaths = Number.isFinite(settings.deaths) ? settings.deaths : latest.deaths;
	const savedNextTarget = Number.isFinite(settings.nextTarget) ? settings.nextTarget : null;
	const savedMediumTarget = Number.isFinite(settings.mediumTarget) ? settings.mediumTarget : null;

	const rows = [
		[
			'timestamp',
			'kills',
			'deaths',
			'kdr',
			'baseKills',
			'baseDeaths',
			'nextTarget',
			'mediumTarget',
			'lastKills',
			'lastDeaths',
		],
		...history.map(item => [
			new Date(item.timestamp).toISOString(),
			item.kills,
			item.deaths,
			Number.isFinite(item.kdr) ? item.kdr.toFixed(14) : 'Infinity',
			base.kills,
			base.deaths,
			Number.isFinite(savedNextTarget) ? savedNextTarget : '',
			Number.isFinite(savedMediumTarget) ? savedMediumTarget : '',
			savedKills,
			savedDeaths,
		]),
	];
	const csv = rows.map(row => row.join(',')).join('\n');
	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = 'kdr-history.csv';
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
	showSnackbar('Download completed successfully.', 'success');
}

function parseImportedHistory(text) {
	const lines = text.split(/\r?\n/).filter(line => line.trim().length);
	if (!lines.length) return [];

	const hasHeader = lines[0].toLowerCase().includes('timestamp');
	const rows = hasHeader ? lines.slice(1) : lines;

	const parsed = rows.map(line => {
		const [timestamp, kills, deaths, kdr] = line.split(',');
		const parsedKills = Number(kills);
		const parsedDeaths = Number(deaths);
		const parsedKdr = Number(kdr);
		const computedKdr = calculateKdr(parsedKills, parsedDeaths);
		return {
			timestamp: timestamp ? new Date(timestamp).getTime() : Date.now(),
			kills: Number.isFinite(parsedKills) ? parsedKills : 0,
			deaths: Number.isFinite(parsedDeaths) ? parsedDeaths : 0,
			kdr: Number.isFinite(parsedKdr) ? parsedKdr : computedKdr,
		};
	}).filter(item => Number.isFinite(item.timestamp));

	return parsed.sort((a, b) => b.timestamp - a.timestamp);
}

function importHistoryFile(file) {
	if (!file) {
		showSnackbar('Please select a file to import.', 'error');
		return;
	}
	const reader = new FileReader();
	reader.onload = event => {
		const text = String(event.target.result || '');
		const imported = parseImportedHistory(text);
		if (!imported.length) {
			showSnackbar('No valid data found in the file.', 'error');
			return;
		}
		const limit = getLimit();
		const trimmed = imported.slice(0, limit);
		saveHistory(trimmed);
		renderHistory(trimmed);
		showSnackbar('Import completed successfully.', 'success');
	};
	reader.onerror = () => {
		showSnackbar('Failed to read the file.', 'error');
	};
	reader.readAsText(file);
}

function clearHistory() {
	saveHistory([]);
	renderHistory([]);
}

historyLimitInput.value = getLimit();
const base = loadBase();
const settings = loadSettings();
const history = loadHistory();
const latest = history[0];
// Initialize inputs empty if 0 to show placeholders
baseKillsInput.value = base.kills > 0 ? base.kills : '';
baseDeathsInput.value = base.deaths > 0 ? base.deaths : '';
nextInput.value = '';
mediumInput.value = '';
if (Number.isFinite(settings.kills) && Number.isFinite(settings.deaths)) {
	killsInput.value = settings.kills;
	deathsInput.value = settings.deaths;
} else if (latest) {
	killsInput.value = latest.kills;
	deathsInput.value = latest.deaths;
}
renderHistory(history);
updateLiveOutputs();

['input', 'change'].forEach(eventName => {
	[killsInput, deathsInput, nextInput, mediumInput].forEach(input => {
		input.addEventListener(eventName, updateLiveOutputs);
	});
});

['input', 'change'].forEach(eventName => {
	[killsInput, deathsInput].forEach(input => {
		input.addEventListener(eventName, updateSetBaseButtonState);
	});
});


historyLimitInput.addEventListener('change', event => {
	const limit = setLimit(Number(event.target.value));
	const history = loadHistory().slice(0, limit);
	saveHistory(history);
	renderHistory(history);
});

form.addEventListener('submit', event => {
	event.preventDefault();
	const kills = Number(killsInput.value);
	const deaths = Number(deathsInput.value);
	if (!Number.isFinite(kills) || !Number.isFinite(deaths)) {
		showSnackbar('Please fill kills and deaths correctly.', 'error');
		return;
	}
	addCalculation(kills, deaths);
});

setBaseBtn.addEventListener('click', () => {
	const hasKills = baseKillsInput.value !== '';
	const hasDeaths = baseDeathsInput.value !== '';
	if (!hasKills || !hasDeaths) {
		showSnackbar('Fill base kills and deaths.', 'error');
		return;
	}
	const kills = Number(baseKillsInput.value);
	const deaths = Number(baseDeathsInput.value);
	if (!Number.isFinite(kills) || !Number.isFinite(deaths)) {
		showSnackbar('Invalid base values.', 'error');
		return;
	}
	saveBase(kills, deaths);
	renderHistory(loadHistory());
	updateLiveOutputs();
	showSnackbar('Base KDR saved successfully.', 'success');
	
	// Clear inputs and reset button state
	baseKillsInput.value = '';
	baseDeathsInput.value = '';
	updateSetBaseButtonState();
});

// Enable/Disable Save button when typing in Base inputs
[baseKillsInput, baseDeathsInput].forEach(input => {
	input.addEventListener('input', () => {
		updateSetBaseButtonState();
	});
});

updateSetBaseButtonState();

swapBaseBtn.addEventListener('click', () => {
	setSwapPending(true);
	showSnackbar('Confirm the swap to proceed.', 'info');
});

confirmSwapBtn?.addEventListener('click', () => {
	const currentKills = Number(killsInput.value);
	const currentDeaths = Number(deathsInput.value);
	const baseKills = Number(baseKillsInput.value);
	const baseDeaths = Number(baseDeathsInput.value);
	if (!Number.isFinite(currentKills) || !Number.isFinite(currentDeaths)) {
		showSnackbar('Please fill kills and deaths correctly.', 'error');
		setSwapPending(false);
		return;
	}
	killsInput.value = baseKills;
	deathsInput.value = baseDeaths;
	baseKillsInput.value = currentKills;
	baseDeathsInput.value = currentDeaths;
	saveBase(currentKills, currentDeaths);
	renderHistory(loadHistory());
	updateLiveOutputs();
	setSwapPending(false);
	showSnackbar('Base and current KDR swapped successfully.', 'success');
});

downloadBtn.addEventListener('click', downloadHistory);
clearBtn.addEventListener('click', clearHistory);
importInput.addEventListener('change', event => {
	const file = event.target.files?.[0];
	importHistoryFile(file);
	event.target.value = '';
});

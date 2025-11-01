// MIDI Controller JavaScript
class MIDIController {
    constructor() {
        this.midiAccess = null;
        this.midiInputs = [];
        this.midiOutputs = [];
        this.selectedInput = null;
        this.selectedOutput = null;
        this.isConnected = false;
        
        this.initializeElements();
        this.bindEvents();
        this.checkMIDISupport();
    }

    initializeElements() {
        this.connectButton = document.getElementById('connect-midi');
        this.statusIndicator = document.getElementById('midi-status');
        this.statusDot = this.statusIndicator.querySelector('.status-dot');
        this.statusText = this.statusIndicator.querySelector('.status-text');
        this.inputSelect = document.getElementById('midi-inputs');
        this.outputSelect = document.getElementById('midi-outputs');
        this.playButton = document.getElementById('play-note');
        this.stopButton = document.getElementById('stop-all');
        this.programButton = document.getElementById('change-program');
        this.logContainer = document.getElementById('midi-log');
        this.clearLogButton = document.getElementById('clear-log');
    }

    bindEvents() {
        this.connectButton.addEventListener('click', () => this.requestMIDIAccess());
        this.inputSelect.addEventListener('change', (e) => this.selectMIDIInput(e.target.value));
        this.outputSelect.addEventListener('change', (e) => this.selectMIDIOutput(e.target.value));
        this.playButton.addEventListener('click', () => this.playNote());
        this.stopButton.addEventListener('click', () => this.stopAllNotes());
        this.programButton.addEventListener('click', () => this.changeProgram());
        this.clearLogButton.addEventListener('click', () => this.clearLog());
    }

    checkMIDISupport() {
        if (!navigator.requestMIDIAccess) {
            this.log('Web MIDI API nije podržan u ovom pregledniku', 'error');
            this.connectButton.disabled = true;
            this.connectButton.textContent = 'MIDI nije podržan';
        }
    }

    async requestMIDIAccess() {
        try {
            this.midiAccess = await navigator.requestMIDIAccess();
            this.log('MIDI pristup uspješno dobiven', 'success');
            this.setupMIDI();
        } catch (error) {
            this.log(`Greška pri pristupu MIDI: ${error.message}`, 'error');
        }
    }

    setupMIDI() {
        this.midiInputs = Array.from(this.midiAccess.inputs.values());
        this.midiOutputs = Array.from(this.midiAccess.outputs.values());
        
        this.populateSelects();
        this.updateStatus();
        
        // Automatski odaberi prvi dostupni uređaj
        if (this.midiInputs.length > 0) {
            this.selectMIDIInput(this.midiInputs[0].id);
        }
        if (this.midiOutputs.length > 0) {
            this.selectMIDIOutput(this.midiOutputs[0].id);
        }
    }

    populateSelects() {
        // Popuni input select
        this.inputSelect.innerHTML = '<option value="">Odaberite MIDI ulaz...</option>';
        this.midiInputs.forEach(input => {
            const option = document.createElement('option');
            option.value = input.id;
            option.textContent = input.name || `MIDI Input ${input.id}`;
            this.inputSelect.appendChild(option);
        });

        // Popuni output select
        this.outputSelect.innerHTML = '<option value="">Odaberite MIDI izlaz...</option>';
        this.midiOutputs.forEach(output => {
            const option = document.createElement('option');
            option.value = output.id;
            option.textContent = output.name || `MIDI Output ${output.id}`;
            this.outputSelect.appendChild(option);
        });
    }

    selectMIDIInput(inputId) {
        if (this.selectedInput) {
            this.selectedInput.onmidimessage = null;
        }

        this.selectedInput = this.midiInputs.find(input => input.id === inputId);
        
        if (this.selectedInput) {
            this.selectedInput.onmidimessage = (event) => this.handleMIDIMessage(event);
            this.log(`MIDI ulaz povezan: ${this.selectedInput.name}`, 'success');
        }
        
        this.updateStatus();
    }

    selectMIDIOutput(outputId) {
        this.selectedOutput = this.midiOutputs.find(output => output.id === outputId);
        
        if (this.selectedOutput) {
            this.log(`MIDI izlaz povezan: ${this.selectedOutput.name}`, 'success');
        }
        
        this.updateStatus();
    }

    handleMIDIMessage(event) {
        const data = event.data;
        const command = data[0] & 0xF0;
        const channel = data[0] & 0x0F;
        const note = data[1];
        const velocity = data[2];

        let message = '';
        let logClass = '';

        switch (command) {
            case 0x90: // Note On
                message = `Note On: Note ${note} (${this.getNoteName(note)}) Velocity: ${velocity} Channel: ${channel + 1}`;
                logClass = 'note-on';
                break;
            case 0x80: // Note Off
                message = `Note Off: Note ${note} (${this.getNoteName(note)}) Channel: ${channel + 1}`;
                logClass = 'note-off';
                break;
            case 0xB0: // Control Change
                message = `Control Change: Controller ${data[1]} Value: ${data[2]} Channel: ${channel + 1}`;
                logClass = 'control';
                break;
            case 0xC0: // Program Change
                message = `Program Change: Program ${data[1]} Channel: ${channel + 1}`;
                logClass = 'control';
                break;
            default:
                message = `MIDI: ${Array.from(data).map(b => b.toString(16).padStart(2, '0')).join(' ')}`;
                logClass = 'control';
        }

        this.log(message, logClass);
    }

    getNoteName(noteNumber) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(noteNumber / 12) - 1;
        const note = notes[noteNumber % 12];
        return `${note}${octave}`;
    }

    playNote() {
        if (!this.selectedOutput) {
            this.log('Nije odabran MIDI izlaz', 'error');
            return;
        }

        const note = 60; // C4
        const velocity = 100;
        const channel = 0;

        // Note On
        this.selectedOutput.send([0x90 + channel, note, velocity]);
        this.log(`Sviraj notu: ${this.getNoteName(note)}`, 'note-on');

        // Note Off nakon 1 sekunde
        setTimeout(() => {
            this.selectedOutput.send([0x80 + channel, note, 0]);
            this.log(`Zaustavi notu: ${this.getNoteName(note)}`, 'note-off');
        }, 1000);
    }

    stopAllNotes() {
        if (!this.selectedOutput) {
            this.log('Nije odabran MIDI izlaz', 'error');
            return;
        }

        // Pošalji All Notes Off za sve kanale
        for (let channel = 0; channel < 16; channel++) {
            this.selectedOutput.send([0xB0 + channel, 123, 0]); // All Notes Off
        }
        
        this.log('Zaustavljeni svi tonovi', 'control');
    }

    changeProgram() {
        if (!this.selectedOutput) {
            this.log('Nije odabran MIDI izlaz', 'error');
            return;
        }

        const program = Math.floor(Math.random() * 128); // Nasumični program 0-127
        const channel = 0;

        this.selectedOutput.send([0xC0 + channel, program]);
        this.log(`Promijenjen program: ${program}`, 'control');
    }

    updateStatus() {
        const hasInput = this.selectedInput !== null;
        const hasOutput = this.selectedOutput !== null;
        
        if (hasInput || hasOutput) {
            this.statusDot.classList.add('connected');
            this.statusText.textContent = 'Povezano';
            this.isConnected = true;
        } else {
            this.statusDot.classList.remove('connected');
            this.statusText.textContent = 'Nije povezano';
            this.isConnected = false;
        }
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        this.logContainer.appendChild(logEntry);
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
        
        console.log(`[MIDI] ${message}`);
    }

    clearLog() {
        this.logContainer.innerHTML = '';
    }
}

// Inicijalizacija kada se stranica učita
document.addEventListener('DOMContentLoaded', () => {
    window.midiController = new MIDIController();
}); 
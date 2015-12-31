/*
Copyright (c) 2013 William Malone (www.williammalone.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*global window, document, navigator, HTMLElement */

var BLOCKS;

if (BLOCKS === undefined) {
	BLOCKS = {};
}

BLOCKS.audio = {};

BLOCKS.audio.soundInstance = function (player) {
	
	"use strict";
	
	var inst = {};
	
	inst.stop = player.stopSoundInstance(inst);
	inst.play = player.playSoundInstance(inst);
	inst.getSoundGain = player.getSoundInstanceGain();
	
	return inst;
};

BLOCKS.audio.audioElementPlayer = function (spec) {
	
	"use strict";
	
	var speaker = BLOCKS.eventDispatcher(),
		spriteSrc,
		curSoundInst,
		initialized = false,
		loadStarted = false,
		loadComplete = false,
		ready = false,
		loadPercentage = 0,
		prevLoadPercentage,
		audioElement,
		loadInterval,
		soundCompleteTimer,
		sounds = {},
		muted = false,
		maybeReady = false,
		resetGainValue,
		pausedFirstTime,
		
		testSoundComplete = function () {
		
			if (!ready) {
				ready = true;
				if (speaker.debug) {
					BLOCKS.debug("audio ready");
				}
				speaker.dispatchEvent("ready");
			}
		},
		
		setReady = function () {
		
			if (!maybeReady) {
			
				maybeReady = true;

				speaker.createSound({
					name: "BlocksTestSound",
					start: 0,
					end: 0.5
				});
				playSound("BlocksTestSound", testSoundComplete);
				window.setTimeout(function () {
					if (!ready) {
						playSound("BlocksTestSound", testSoundComplete);
						
						window.setTimeout(function () {
							if (!ready) {
								testSoundComplete();
							}
						}, 10000);
					}
				}, 10000);
			}
		},
		
		onCanPlayThrough = function () {	
			if (speaker.debug) {
				BLOCKS.debug("onCanPlayThrough");	
			}			
			setReady();
		},
		
		load = function () {
		
			if (!audioElement) {
				return;
			}
		
			if (speaker.debug) {
				BLOCKS.debug("load audio sprite: " + spriteSrc);
			}
			
			if (loadInterval) {
				window.clearInterval(loadInterval);
			}

			loadInterval = window.setInterval(function () {
			
				var loadTime, loadPercentage;
				
				//if (speaker.debug) {
				//	BLOCKS.debug("audioElement.buffered.length: " + audioElement.buffered.length);
				//}
		
				if (!audioElement.buffered.length) {
					return;
				}
				
				loadTime = audioElement.buffered.end(audioElement.buffered.length - 1);
				loadPercentage = loadTime / audioElement.duration * 100;

				if (!isNaN(loadPercentage) && prevLoadPercentage !== loadPercentage) {
					prevLoadPercentage = loadPercentage;
					speaker.dispatchEvent("loadUpdate");
					if (speaker.debug) {
						BLOCKS.debug("loadUpdate: " + Math.round(loadPercentage) + "%");
					}
					if (!pausedFirstTime) {
						pausedFirstTime = true;
						audioElement.pause(); 
					}
				}
                                  
				if (window.Math.abs(loadTime - audioElement.duration) < 0.1) {
					window.clearInterval(loadInterval);
					setReady();
					speaker.dispatchEvent("loadComplete");
					if (speaker.debug) {
						BLOCKS.debug("loadComplete");
					}
				}
			}, 100);
			
			audioElement.src = spriteSrc;
			
			audioElement.play();
		},
		
		endSound = function () {
			
			// Clear the sound complete timer
			window.clearInterval(soundCompleteTimer);
			soundCompleteTimer = null;
			//if (audioElement) {
				audioElement.pause();
			//}
		},
		
		stop = function () {
		
			endSound();
			curSoundInst = null;
		},
		
		soundCompleteChecker = function () {
		
			var inst, atEnd;
	
			// If a sound is playing
			if (curSoundInst) {
		
				// If the scrubber is past the sound end time then the sound is complete
				if (audioElement.currentTime >= curSoundInst.end || audioElement.currentTime >= audioElement.duration) {
				
					// If the sound is set to loop then move the scrubber to the beginning of the sound
					if (curSoundInst.loop === true) {
						
						if (audioElement.currentTime >= audioElement.duration) {
							atEnd = true;
						}

						audioElement.currentTime = curSoundInst.start;

						// If the current time is at the end then play after moving scrubber
						if (atEnd) {
							audioElement.play();
						}
					} else {
					
						endSound();
						speaker.dispatchEvent("played");
						
						inst = curSoundInst;
						curSoundInst = null;
						
						if (inst.callback) {
							inst.callback(inst.name);
						}
					}
				}
			} else {
				window.clearInterval(soundCompleteTimer);
			}
		},
		
		playSound = function (name, callback) {
	
			if (speaker.debug) {
				BLOCKS.debug("Play sound: " + name + " (" + sounds[name].start + " - " + sounds[name].end + ")");
			}
	
			if (sounds[name].end >= audioElement.duration) {
				BLOCKS.warn("Sound ('" + sounds[name].name + "') end time is larger than sprite duration. Setting end time to the sprite duration.");
				sounds[name].end = audioElement.duration - 0.0001;
			}
		
			if (sounds[name].start >= 0 && sounds[name].end > 0) {

				// If the previous sound had a different volume set temporarily
				if (resetGainValue >= 0) {
					audioElement.volume = resetGainValue;
					resetGainValue = null;
				}

				// Save the sound about to play
				curSoundInst = {
					name: sounds[name].name,
					start: sounds[name].start,
					end: sounds[name].end,
					loop: sounds[name].loop,
					sound: sounds[name].sound,
					callback: callback
				};
				
				// Move the scrubber to the start of the sound
				audioElement.currentTime = sounds[name].start;
				
				// Play the sound
				audioElement.play();
				
				// Start a listener to check if the sound is complete
				if (soundCompleteTimer) {
					window.clearInterval(soundCompleteTimer);
				}
				soundCompleteTimer = window.setInterval(soundCompleteChecker, 100);
				
				return true;
			} else {
				BLOCKS.warn("Sound parameters not specified.");
				return false;
			}
		},
	
		// Pause the audio element
		pause = function () {
	
			audioElement.pause();
		},
	
		// Play the audio element if a sound is currently playing 
		unpause = function () {
	
			if (curSoundInst) {
				audioElement.play();
			}
		},

		// Mute all sound
		mute = function () {
	
			audioElement.volume = 0;
		},
		
		// Unmute all sound
		unmute = function () {
	
			audioElement.volume = 1;
		};
		
	speaker.setSoundGain = function (name, gain) {
		
		if (curSoundInst && curSoundInst.name === name) {
			// Save the current volume to be reset for next sound
			resetGainValue = audioElement.volume;
			audioElement.volume = gain;
		}
	};
		
	speaker.play = function (name, callback) {
	
		if (sounds[name]) {
			return playSound(name, callback);
		} else {
			BLOCKS.warn("Cannot play sound '" + name + "' because it was not defined");
		}
	};
	
	// Pause the audio element
	speaker.pause = function () {
	
		pause();
	};
	
	// Unpause the audio element
	speaker.unpause = function () {
	
		unpause();
	};
	
	// Pause the audio element and clear the current sound
	speaker.stop = function () {
	
		stop();
	};
	
	// Mute all sound
	speaker.mute = function () {
	
		if (!muted) {
			mute();
		}
	
		muted = true;
	};
	
	// Unmute all sound
	speaker.unmute = function () {
	
		if (muted) {
			unmute();
		}
	
		muted = false;
	};
	
	speaker.isMuted = function () {
		
		return muted;	
	};
	
	// Return if audio is ready to be played
	speaker.isReady = function () {
	
		return ready;
	};
	
	speaker.load = function () {

		if (!loadStarted) {
			loadStarted = true;
			load();
		}
	};
	
	speaker.createSound = function (spec) {
		
		// Support legacy startTime, endTime and duration properties
		if (spec.startTime !== undefined && spec.start === undefined) {
			spec.start = spec.startTime;
		}
		
		if (spec.endTime !== undefined && spec.end === undefined) {
			spec.end = spec.endTime;
		}
		
		if (spec.duration !== undefined && spec.end === undefined) {
			spec.end = spec.start + spec.duration;	
		}
		
		if (spec.end > audioElement.duration) {
			BLOCKS.warn("Sound ('" + spec.name + "') end time is larger than sprite duration. Setting end time to the sprite duration.");
			spec.end = audioElement.duration - 0.0001;
		}

		//if (sounds[spec.name] && spec.name !== "BlocksTestSound") {
		//	BLOCKS.warn("Sound ('" + spec.name + "') already created. Overriding previous sound.");
		//}

		sounds[spec.name] = {
			name: spec.name,
			start: spec.start,
			end: spec.end,
			loop: spec.loop
		};
	};
	
	speaker.getActiveSounds = function () {
	
		return [curSoundInst];
	};
	
	speaker.getNumFiles = function () {
		
		return 1;
	};
	
	speaker.getNumFilesLoaded = function () {
	
		return ready ? 1 : 0;
	};
	
	speaker.destroy = function () {
		audioElement = null;
	};

	// Create audio element
	(function () {

		if (spec && spec.src) {

			// Add audio path
			if (spec.path) {
				spriteSrc = spec.path;
			} else {
				spriteSrc = "";
			}

			// Add the sprite filename without extension
			spriteSrc += spec.src;
			
			audioElement = document.createElement("audio");
			audioElement.addEventListener("canplaythrough", onCanPlayThrough);
			
						
			// Add the extension
			if (audioElement.canPlayType("audio/mpeg")) {
				spriteSrc += ".mp3";
			} else if (audioElement.canPlayType("audio/ogg")) {
				spriteSrc += ".ogg";
			}
			
			
		} else {
			BLOCKS.error("sprite filename not specified");
		}
	}());
	
	return speaker;
};

BLOCKS.audio.webAudioPlayer = function (spec) {
	
	"use strict";
	
	var speaker = BLOCKS.eventDispatcher(),
		initialized = false,
		loadStarted = false,
		loadComplete = false,
		ready = false,
		muted = false,
		extension,
		path = (spec && spec.path) || "",
		masterGain,
		ctx,
		sounds = {},
		files = {},
		instances = [],
		tracks = {},
		loadTimeoutId,
		maxLoadTime = spec.maxLoadTime || 60000, // The maximum amount of time for all sounds to load
		loadTries = 0,
		maxLoadTries = 5,
		
		createTrack = function (name) {
		
			if (!tracks[name]) {
				tracks[name] = {
					name: name,
					gain: (ctx.createGain) ? ctx.createGain() : ctx.createGainNode()
				};
				
				// Connect the track's gain node to the master node
				tracks[name].gain.connect(masterGain);
			}
			
			return tracks[name];
		},
		
		onFileLoaded = function (file) {
		
			var key, numFilesLoaded, totalNumFiles;
			
			numFilesLoaded = speaker.getNumFilesLoaded();
			totalNumFiles = speaker.getNumFiles();
		
			if (speaker.debug) {
				BLOCKS.debug("load: " + numFilesLoaded + " of " + totalNumFiles);
			}
//BLOCKS.debug("load: " + numFilesLoaded + " of " + totalNumFiles + " (" + file.src + ")");			
			speaker.dispatchEvent("update", numFilesLoaded, totalNumFiles);
			
			if (numFilesLoaded === totalNumFiles) {
				
				if (!ready) {
					ready = true;
					
					// Clear the load timeout
					window.clearTimeout(loadTimeoutId);
					if (speaker.debug) {
						BLOCKS.debug("audio ready");
					}
//BLOCKS.debug("speaker is ready");
					speaker.dispatchEvent("ready");
				}
			}
		},
		
		loadFile = function (file) {
		
			file.request = new window.XMLHttpRequest();
			
			// For Internet Explorer
			if (!("withCredentials" in file.request)) {
				file.request = new window.XDomainRequest();
			}
		
			file.request.open("get", path + file.src + extension, true);
			file.request.responseType = "arraybuffer";

			file.request.onload = function() {

//BLOCKS.debug("Sound Loaded: " + (path + file.src + extension) + " -> " + file.request);

				ctx.decodeAudioData(file.request.response, function(buffer) {

//BLOCKS.debug("Sound Decoded: " + (path + file.src + extension) + " -> " + file.request);
					
					file.buffer = buffer;
					file.loaded = true;
					
					// TODO: Dispatch an notification that the file has been loaded for the first time, in case we want to play it after its loaded
					
					// TODO: Update the progress if we are waiting for pre-load
					onFileLoaded(file);
					
					file.request = null;
					
				}, function (error) {
					if (BLOCKS.debug) {
						BLOCKS.debug("Error decoding buffer: " + path + file.src + extension);
					}
					file.request = null;
				});
			};
			file.request.send();
		},
		
		load = function () {
		
			var source;
			
			if (ctx) {
			
				loadStarted = true;
			
				source = ctx.createOscillator();
	
				if (source.start) {
					source.start(0, 0, 1);
				} else if (source.noteGrainOn) {
					source.noteGrainOn(0, 0, 1);
				}
			}
		},
		
		destroyInstance = function (inst) {
			
			var i, index;
			
			for (i = 0; i < instances.length; i += 1) {
			
				if (instances[i] === inst) {
					instances[i] = null;
					index = i;
					break;
				}	
			}

			instances.splice(index, 1);
		},
		
		soundCompleteChecker = function (inst) {
		
			var callback, soundName;
		
			if (speaker.debug) {
				BLOCKS.debug("Sound '" + inst.sound.name + "' Complete");
			}

			if (inst.callback) {
				callback = inst.callback;
				soundName = inst.name;
			}
		
			// Destroy the instance before calling a possible callback
			destroyInstance(inst);
			
			if (callback) {
				callback(soundName);
			}
		},

		stopSound = function (inst) {
		
			window.clearTimeout(inst.timeout);

			if (inst.source.stop) {
				inst.source.stop(0);
			} else if (inst.source.noteGrainOff) {
				inst.source.noteGrainOff(0);
			} else {					
				inst.source.noteOff(0);
			}
			
			destroyInstance(inst);
		},

		getSoundGain = function (inst) {
		
			return inst.gain.gain.value;
		},
		
		setSoundGain = function (inst, gainValue, delay) {
		
			// If the sound doesn't have its own gain then create its own gain we can change
			if (inst.gain === inst.track.gain) {
				
				// Disconnect the source from its track gain node
				inst.source.disconnect(0);
				
				// Create a new gain
				inst.gain = (ctx.createGain) ? ctx.createGain() : ctx.createGainNode();
				inst.gain.connect(masterGain);
				
				// Connect the source to the new gain
				inst.source.connect(inst.gain);
			}
			if (speaker.debug) {
				BLOCKS.debug("speaker.setSoundGain of sound '" + inst.name + "' to '" + gainValue + "'");
			}			
			// If the gain should be faded out
			if (delay) {
				inst.gain.gain.linearRampToValueAtTime(inst.gain.gain.value, ctx.currentTime);
				inst.gain.gain.linearRampToValueAtTime(gainValue, ctx.currentTime + delay);
			} else {
				inst.gain.gain.value = gainValue;
			}
		},
		
		pauseSound = function (inst) {

			window.clearTimeout(inst.timeout);
			
			inst.currentTime = ((+ new Date()) - inst.startTime) / 1000 % inst.source.buffer.duration;
		
			if (inst.source.stop) {
				inst.source.stop(0);
			} else if (inst.source.noteGrainOff) {
				inst.source.noteGrainOff(0);
			} else {					
				inst.source.noteOff(0);
			}
			
			//if (speaker.debug) {
			//	BLOCKS.debug("Pause sound: '" + inst.name + "' at scrubber position of " + inst.currentTime.toFixed(2));
			//}
		},
		
		unpauseSound = function (inst) {
		
			var newInst;
			
			//if (speaker.debug) {
			//	BLOCKS.debug("Unpause sound: '" + inst.name + "'");
			//}
		
			// Play a new instance of the sound
			newInst = playSound(inst.name, inst.callback, inst.track.name, inst.currentTime);

			if (inst.gain.gain.value !== 1) {
				setSoundGain(newInst, inst.gain.gain.value);
			}
			
			// Delete the old instance
			destroyInstance(inst);
		},
		
		playSound = function (name, callback, trackName, currentTime, delay) {
		
			var inst = {};

			if (sounds[name].file.loaded) {
			
				instances.push(inst);
				inst.sound = sounds[name];
				inst.name = name;
				
				// If an offset is set (set when unpausing a sound)
				if (currentTime) {
					inst.currentTime = currentTime;
				} else {
					// Start from the beginning of the sound
					inst.currentTime = 0;
				}
				
				// Save when the sound starts, or would have started if started from the beginning
				inst.startTime = (+ new Date()) - inst.currentTime * 1000;
				
				if (delay) {
					// Play the sound after a delay
					inst.delay = ctx.currentTime + delay;
				} else {
					// Play the sound immediately
					delay = 0;
					inst.delay = 0;
				}
				
				if (trackName) {
					if (!tracks[trackName]) {
						createTrack(trackName);
					}
					inst.track = tracks[trackName];
				} else {
					inst.track = tracks["default"];
				}
				
				// Create a new source for this sound instance
				inst.source = ctx.createBufferSource();
				inst.source.buffer = sounds[name].file.buffer;
				inst.source.loop = sounds[name].loop;
				inst.gain = inst.track.gain;
				
				// Connect the source to the gains
				inst.source.connect(inst.gain);
				
				if (!sounds[name].loop) {
					// Timeout at the end of the sound
					inst.timeout = window.setTimeout(soundCompleteChecker, (delay + inst.source.buffer.duration - inst.currentTime) * 1000, inst);
					
					// Assign a callback to be called once the sound is complete
					inst.callback = callback;
				}

				if (speaker.debug) {
					if (inst.currentTime) {
						BLOCKS.debug("Play sound: " + name + " (" + inst.currentTime + " - " + sounds[name].end + "), src: " + sounds[name].file.src + extension);
					} else {
						BLOCKS.debug("Play sound: " + name + " (" + sounds[name].start + " - " + sounds[name].end + "), src: " + sounds[name].file.src + extension);
					}
				}
							
				// Play the sound
				if (inst.source.start) {
					// If an offset is specified then add the start time and duration parameters
					if (inst.currentTime) {
						inst.source.start(inst.delay, inst.currentTime/*, inst.source.buffer.duration - inst.currentTime*/);
					} else {
						inst.source.start(inst.delay);
					}
				} else if (inst.source.noteGrainOn) {
					inst.source.noteGrainOn(inst.delay, inst.currentTime, inst.source.buffer.duration - inst.currentTime);
				}
				
				return inst;
			} else {
				// TODO: Play the unloaded sound once its loaded
				//if (speaker.debug) {
					BLOCKS.warn("Tried to play sound: " + name + ", but it is not loaded yet");
				//}
			}
		},
		
		createLoadTimer = function () {
			
			loadTimeoutId = window.setTimeout(function () {
			
				var key;
			
				for (key in files) {
					if (files.hasOwnProperty(key)) {
						if (!files[key].loaded) {
							
							// Cancel the request
							if (files[key].request) {
								BLOCKS.warn("Sound file load has timed out. Aborting request and trying again: " + files[key].src);
								files[key].request.abort();
							} else {
								BLOCKS.warn("Sound file load has timed out. Sending additional request: " + files[key].src);
							}
							loadFile(files[key]);
						}
					}
				}
				
				loadTries += 1;
				if (loadTries < maxLoadTries) {
					createLoadTimer();
				}
				
			}, maxLoadTime);
		};

	speaker.play = function (name, callback, trackName, startTime, delay) {

		if (sounds[name]) {
			return playSound(name, callback, trackName, startTime, delay);
		} else {
			BLOCKS.warn("Cannot play sound '" + name + "' because it was not defined");
		}
	};
	
	speaker.getSoundDuration = function (name) {
	
		return sounds[name].file.buffer.duration;
	};
	
	speaker.getSoundInstanceGain = function (inst) {
	
		return getSoundGain(inst);
	};
	
	speaker.getSoundGain = function (name) {
	
		var i, instanceArr = instances.slice(0);
			
		for (i = 0; i < instanceArr.length; i += 1) {
			if (instanceArr[i].name === name) {
			
				return getSoundGain(instanceArr[i]);
			}
		}
	};
	
	speaker.setSoundInstanceGain = function (inst, gainValue, delay) {
	
		setSoundGain(inst, gainValue, delay);
	};
	
	speaker.setSoundGain = function (name, gainValue, delay) {
	
		var i, instanceArr = instances.slice(0);
			
		for (i = 0; i < instanceArr.length; i += 1) {
			if (instanceArr[i].name === name) {
			
				setSoundGain(instanceArr[i], gainValue, delay);
			}
		}
	};
	
	speaker.stopSound = function (name) {
	
		var i, instanceArr = instances.slice(0);
				
		for (i = 0; i < instanceArr.length; i += 1) {
			if (instanceArr[i].name === name) {
				stopSound(instanceArr[i]);
			}
		}
	};
	
	speaker.pauseSound = function (name) {
	
		var i, instanceArr = instances.slice(0);
			
		for (i = 0; i < instanceArr.length; i += 1) {
			if (instanceArr[i].name === name) {
				pauseSound(instanceArr[i]);
			}
		}
	};
	
	speaker.unpauseSound = function (name) {
	
		var i, instanceArr = instances.slice(0);
			
		for (i = 0; i < instanceArr.length; i += 1) {
			if (instanceArr[i].name === name) {
				unpauseSound(instanceArr[i]);
			}
		}
	};

	speaker.stopTrack = function (trackName) {
	
		var i, instanceArr = instances.slice(0);
			
		for (i = 0; i < instanceArr.length; i += 1) {
			if (instanceArr[i].track.name === trackName) {
				stopSound(instanceArr[i]);
			}
		}
	};
	
	speaker.pauseTrack = function (trackName) {
	
		var i, instanceArr = instances.slice(0);
			
		for (i = 0; i < instanceArr.length; i += 1) {
			if (instanceArr[i].track.name === trackName) {
				pauseSound(instanceArr[i]);
			}
		}
	};
	
	speaker.unpauseTrack = function (trackName) {
	
		var i, instanceArr = instances.slice(0);
			
		for (i = 0; i < instanceArr.length; i += 1) {
			if (instanceArr[i].track.name === trackName) {
				unpauseSound(instanceArr[i]);
			}
		}
	};
	
	// Stop all sounds
	speaker.stop = function () {
	
		var i, instanceArr = instances.slice(0);
		
		for (i = 0; i < instanceArr.length; i += 1) {
			stopSound(instanceArr[i]);
		}
	};
	
	// Pause all sounds
	speaker.pause = function () {
	
		var i, instanceArr = instances.slice(0);
		
		for (i = 0; i < instanceArr.length; i += 1) {
			pauseSound(instanceArr[i]);
		}
	};
	
	// Unpause any paused sounds
	speaker.unpause = function () {
	
		var i, instanceArr = instances.slice(0);
			
		for (i = 0; i < instanceArr.length; i += 1) {
			unpauseSound(instanceArr[i]);
		}
	};
	
	// Mute all sound
	speaker.mute = function () {

		if (!muted) {
			muted = true;
			masterGain.gain.value = 0;
		}
	};
	
	// Unmute all sound
	speaker.unmute = function () {

		if (muted) {
			muted = false;
			masterGain.gain.value = 1;
		}
	};
	
	speaker.isMuted = function () {
		
		return muted;	
	};
	
	// Load the audio element
	speaker.load = function () {

		if (!loadStarted) {
			loadStarted = true;
			
			createLoadTimer();
			
			load();
		}
	};
	
	// Return if audio is ready to be played
	speaker.isReady = function () {
	
		return ready;
	};
	
	speaker.createSound = function (spec) {
		
		//if (sounds[spec.name] && spec.name !== "BlocksTestSound") {
		//	BLOCKS.warn("Sound ('" + spec.name + "') already created. Overriding previous sound.");
		//}

		sounds[spec.name] = {
			name: spec.name,
			start: spec.start,
			end: spec.end,
			loop: spec.loop
		};
//BLOCKS.debug("Create Sound: " + spec.name);
		if (!files[spec.src]) {
			files[spec.src] = {
				src: spec.src
			};
			loadFile(files[spec.src]);
//BLOCKS.debug("Load Sound: " + spec.src);
		}
		
		sounds[spec.name].file = files[spec.src];
	};
	
	speaker.getActiveSoundInstances = function () {
	
		return instances;
	};
	
	speaker.getNumFiles = function () {
	
		var key, totalNumFiles;

		totalNumFiles = 0;
		
		// Determine load progress
		for (key in files) {
			if (files.hasOwnProperty(key)) {
				totalNumFiles += 1;
			}
		}
		
		return totalNumFiles;
	};
	
	speaker.getNumFilesLoaded = function () {
	
		var key, numFilesLoaded;
			
		numFilesLoaded = 0;
		
		// Determine load progress
		for (key in files) {
			if (files.hasOwnProperty(key)) {
				if (files[key].loaded) {
					numFilesLoaded += 1;
				}
			}
		}
		
		return numFilesLoaded;
	};
	
	speaker.getCurrentTime = function () {
		
		return ctx.currentTime;
	};
	
	speaker.destroy = function () {
		
		speaker.stop();
		if (ctx && ctx.close) {
			// Close the WebAudioContext as a way to remove it from memory
			ctx.close();	
		}
		ctx = null;
	};
	
	speaker.multipleTracksSupported = true;

	(function () {
	
		var tmpAudioElement = document.createElement("audio"), fireFoxDetected;
		
		// Use ogg for Firefox due to a bud decoding buffer data
		fireFoxDetected = (navigator.userAgent.toLowerCase().indexOf('firefox') > -1);

		if (tmpAudioElement.canPlayType("audio/mpeg;").replace(/no/, "") && !!(tmpAudioElement.canPlayType) && !fireFoxDetected) {
			extension = ".mp3";
		} else {
			extension = ".ogg";
		}
	
		if (typeof AudioContext !== "undefined") {
			ctx = new window.AudioContext();
		} else if (typeof webkitAudioContext !== "undefined") {
			ctx = new window.webkitAudioContext();
		}
		
		if (ctx) {
			// Create the master gain node
			masterGain = (ctx.createGain) ? ctx.createGain() : ctx.createGainNode();
			// Connext the master gain node to the context's output
			masterGain.connect(ctx.destination);
		} else {
			BLOCKS.error("Cannot create audio context.");
		}
		
		createTrack("default");
	}());
	
	return speaker;
};

BLOCKS.audio.multiAudioElementPlayer = function (spec) {

	"use strict";
	
	var speaker = BLOCKS.eventDispatcher(),
		initialized = false,
		loadStarted = false,
		loadComplete = false,
		ready = false,
		muted = false,
		path = (spec && spec.path) || "",
		masterGain,
		ctx,
		sounds = {},
		files = {},
		instances = [],
		tracks = {},
		loadTimeoutId,
		maxLoadTime = spec.maxLoadTime || 60000, // The maximum amount of time for all sounds to load
		loadTries = 0,
		maxLoadTries = 5,
		
		createTrack = function (name) {
		
			if (!tracks[name]) {
				tracks[name] = {
					name: name,
					gain: (ctx.createGain) ? ctx.createGain() : ctx.createGainNode()
				};
				
				// Connect the track's gain node to the master node
				tracks[name].gain.connect(masterGain);
			}
			
			return tracks[name];
		},
		
		onFileLoaded = function (file) {
		
			var key, numFilesLoaded, totalNumFiles;
			
			numFilesLoaded = speaker.getNumFilesLoaded();
			totalNumFiles = speaker.getNumFiles();
		
			if (speaker.debug) {
				BLOCKS.debug("load: " + numFilesLoaded + " of " + totalNumFiles);
			}
		
			speaker.dispatchEvent("update", numFilesLoaded, totalNumFiles);
			
			if (numFilesLoaded === totalNumFiles) {
				
				if (!ready) {
					ready = true;
					
					// Clear the load timeout
					window.clearTimeout(loadTimeoutId);
					if (speaker.debug) {
						BLOCKS.debug("audio ready");
					}

					speaker.dispatchEvent("ready");
				}
			}
		},
		
		loadFile = function (file) {
			
			file.audioElement = document.createElement("audio");
			
			file.audioElement.preload = true;
			file.audioElement.src = (path + file.src);
			file.audioElement.load();
			file.audioElement.addEventListener("canplaythrough", function () {
				//BLOCKS.debug("Audio element loaded: " + (path + file.src));
				file.loaded = true;
				onFileLoaded(file);
			});
			//document.body.appendChild(file.audioElement);
		},
		
		load = function () {
		
			/*
			var source;
			
			loadStarted = true;
		
			source = ctx.createOscillator();

			if (source.start) {
				source.start(0, 0, 1);
			} else if (source.noteGrainOn) {
				source.noteGrainOn(0, 0, 1);
			}
			*/
		},
		
		destroyInstance = function (inst) {
			
			var i, index;
			
			for (i = 0; i < instances.length; i += 1) {
			
				if (instances[i] === inst) {
					instances[i] = null;
					index = i;
					break;
				}	
			}

			instances.splice(index, 1);
		},
		
		soundCompleteChecker = function (inst) {
		
			var callback, soundName;
		
			if (speaker.debug) {
				BLOCKS.debug("Sound '" + inst.sound.name + "' Complete");
			}

			if (inst.callback) {
				callback = inst.callback;
				soundName = inst.name;
			}
		
			// Destroy the instance before calling a possible callback
			destroyInstance(inst);
			
			if (callback) {
				callback(soundName);
			}
		},

		stopSound = function (inst) {
		
			if (inst.timeout) {
				window.clearTimeout(inst.timeout);
			}
			if (inst.fadeTimeout) {
				window.clearTimeout(inst.fadeTimeout);
			}
			/*
			if (inst.source.stop) {
				inst.source.stop(0);
			} else if (inst.source.noteGrainOff) {
				inst.source.noteGrainOff(0);
			} else {					
				inst.source.noteOff(0);
			}
			*/
			
			inst.sound.file.audioElement.pause();
			
			destroyInstance(inst);
		},

		getSoundGain = function (inst) {
		
			return inst.sound.file.audioElement.volume;
		},
		
		setSoundGain = function (inst, gainValue, delay) {
			
			var fadeInterval = 10;
			
			// Clear previous fade if it's still going
			if (inst.fadeTimeout) {
				inst.sound.file.audioElement.volume = inst.fadeTarget;
				window.clearInterval(inst.fadeTimeout);
				inst.fadeTarget = 0;
				inst.fadeAmount = 0;
			}
		
			if (delay) {

				// Create timer to fade the gain over time
				inst.fadeTarget = gainValue;
				inst.fadeAmount = (gainValue - inst.sound.file.audioElement.volume) / ((delay * 1000) / fadeInterval);
				inst.fadeTimeout = window.setInterval(function () {
					if (inst.sound.file.audioElement.volume === inst.fadeTarget) {
						window.clearInterval(inst.fadeTimeout);
					}
					inst.sound.file.audioElement.volume += inst.fadeAmount;
				}, fadeInterval);
			} else {
				inst.sound.file.audioElement.volume = gainValue;
			}
		},
		
		pauseSound = function (inst) {

			window.clearTimeout(inst.timeout);
			
			inst.currentTime = ((+ new Date()) - inst.startTime) / 1000 % inst.sound.file.audioElement.duration;
			
			inst.sound.file.audioElement.pause();
		},
		
		unpauseSound = function (inst) {
		
			var newInst;
			
			//if (speaker.debug) {
			//	BLOCKS.debug("Unpause sound: '" + inst.name + "'");
			//}

			newInst = playSound(inst.name, inst.callback, null, inst.currentTime);

			// Delete the old instance
			destroyInstance(inst);
		},
		
		playSound = function (name, callback, trackName, currentTime, delay) {
		
			var inst = {};

			if (sounds[name].file.loaded) {
			
				instances.push(inst);
				inst.sound = sounds[name];
				inst.name = name;
				
				// If an offset is set (set when unpausing a sound)
				if (currentTime) {
					inst.currentTime = currentTime;
				} else {
					// Start from the beginning of the sound
					inst.currentTime = 0;
				}
				
				// Save when the sound starts, or would have started if started from the beginning
				inst.startTime = (+ new Date()) - inst.currentTime * 1000;
				
				if (delay) {
					// Play the sound after a delay
					inst.delay = ctx.currentTime + delay;
				} else {
					// Play the sound immediately
					delay = 0;
					inst.delay = 0;
				}
				
				if (trackName) {
					if (!tracks[trackName]) {
						createTrack(trackName);
					}
					inst.track = tracks[trackName];
				} else {
					inst.track = tracks["default"];
				}
				
				// Create a new source for this sound instance
				//inst.source = ctx.createBufferSource();
				//inst.source.buffer = sounds[name].file.buffer;
				//inst.source.loop = sounds[name].loop;
				//inst.gain = inst.track.gain;
				
				// Connect the source to the gains
				//inst.source.connect(inst.gain);
				
				if (!sounds[name].loop) {
					// Timeout at the end of the sound
					//inst.timeout = window.setTimeout(soundCompleteChecker, (delay + inst.source.buffer.duration - inst.currentTime) * 1000, inst);
					
					// Assign a callback to be called once the sound is complete
					inst.callback = callback;
				} else {
					inst.sound.file.audioElement.loop = true;
				}

				if (speaker.debug) {
					if (inst.currentTime) {
						BLOCKS.debug("Play sound: " + name + " (" + inst.currentTime + " - " + sounds[name].end + "), src: " + sounds[name].file.src);
					} else {
						BLOCKS.debug("Play sound: " + name + " (" + sounds[name].start + " - " + sounds[name].end + "), src: " + sounds[name].file.src);
					}
				}
				
				inst.sound.file.audioElement.currentTime = inst.currentTime;
				inst.sound.file.audioElement.play();
				
				/*
				// Play the sound
				if (inst.source.start) {
					// If an offset is specified then add the start time and duration parameters
					if (inst.currentTime) {
						inst.source.start(inst.delay, inst.currentTime, inst.source.buffer.duration - inst.currentTime);
					} else {
						inst.source.start(inst.delay);
					}
				} else if (inst.source.noteGrainOn) {
					inst.source.noteGrainOn(inst.delay, inst.currentTime, inst.source.buffer.duration - inst.currentTime);
				}
				*/
				
				return inst;
			} else {
				// TODO: Play the unloaded sound once its loaded
				//if (speaker.debug) {
					BLOCKS.warn("Tried to play sound: " + name + ", but it is not loaded yet");
				//}
			}
		},
		
		createLoadTimer = function () {
			
			loadTimeoutId = window.setTimeout(function () {
			
				var key;
			
				for (key in files) {
					if (files.hasOwnProperty(key)) {
						if (!files[key].loaded) {
							
							// Cancel the request
							if (files[key].request) {
								BLOCKS.warn("Sound file load has timed out. Aborting request and trying again: " + files[key].src);
								files[key].request.abort();
							} else {
								BLOCKS.warn("Sound file load has timed out. Sending additional request: " + files[key].src);
							}
							loadFile(files[key]);
						}
					}
				}
				
				loadTries += 1;
				if (loadTries < maxLoadTries) {
					createLoadTimer();
				}
				
			}, maxLoadTime);
		};

	speaker.play = function (name, callback, trackName, startTime, delay) {

		if (sounds[name]) {
			return playSound(name, callback, trackName, startTime, delay);
		} else {
			BLOCKS.warn("Cannot play sound '" + name + "' because it was not defined");
		}
	};
	
	speaker.getSoundDuration = function (name) {
	
		return sounds[name].file.buffer.duration;
	};
	
	speaker.getSoundInstanceGain = function (inst) {
	
		return getSoundGain(inst);
	};
	
	speaker.getSoundGain = function (name) {
	
		var i, instanceArr = instances.slice(0);
			
		for (i = 0; i < instanceArr.length; i += 1) {
			if (instanceArr[i].name === name) {
			
				return getSoundGain(instanceArr[i]);
			}
		}
	};
	
	speaker.setSoundInstanceGain = function (inst, gainValue, delay) {
	
		setSoundGain(inst, gainValue, delay);
	};
	
	speaker.setSoundGain = function (name, gainValue, delay) {
	
		var i, instanceArr = instances.slice(0);
			
		for (i = 0; i < instanceArr.length; i += 1) {
			if (instanceArr[i].name === name) {
			
				setSoundGain(instanceArr[i], gainValue, delay);
			}
		}
	};
	
	speaker.stopSound = function (name) {
	
		var i, instanceArr = instances.slice(0);
				
		for (i = 0; i < instanceArr.length; i += 1) {
			if (instanceArr[i].name === name) {
				stopSound(instanceArr[i]);
			}
		}
	};
	
	speaker.pauseSound = function (name) {
	
		var i, instanceArr = instances.slice(0);
			
		for (i = 0; i < instanceArr.length; i += 1) {
			if (instanceArr[i].name === name) {
				pauseSound(instanceArr[i]);
			}
		}
	};
	
	speaker.unpauseSound = function (name) {
	
		var i, instanceArr = instances.slice(0);
			
		for (i = 0; i < instanceArr.length; i += 1) {
			if (instanceArr[i].name === name) {
				unpauseSound(instanceArr[i]);
			}
		}
	};

	speaker.stopTrack = function (trackName) {
	
		//var i, instanceArr = instances.slice(0);
		//	
		//for (i = 0; i < instanceArr.length; i += 1) {
		//	if (instanceArr[i].track.name === trackName) {
		//		stopSound(instanceArr[i]);
		//	}
		//}
	};
	
	speaker.pauseTrack = function (trackName) {
	
		//var i, instanceArr = instances.slice(0);
		//	
		//for (i = 0; i < instanceArr.length; i += 1) {
		//	if (instanceArr[i].track.name === trackName) {
		//		pauseSound(instanceArr[i]);
		//	}
		//}
	};
	
	speaker.unpauseTrack = function (trackName) {
	
		//var i, instanceArr = instances.slice(0);
		//	
		//for (i = 0; i < instanceArr.length; i += 1) {
		//	if (instanceArr[i].track.name === trackName) {
		//		unpauseSound(instanceArr[i]);
		//	}
		//}
	};
	
	// Stop all sounds
	speaker.stop = function () {
	
		var i, instanceArr = instances.slice(0);
		
		for (i = 0; i < instanceArr.length; i += 1) {
			stopSound(instanceArr[i]);
		}
	};
	
	// Pause all sounds
	speaker.pause = function () {
	
		var i, instanceArr = instances.slice(0);
		
		for (i = 0; i < instanceArr.length; i += 1) {
			pauseSound(instanceArr[i]);
		}
	};
	
	// Unpause any paused sounds
	speaker.unpause = function () {
	
		var i, instanceArr = instances.slice(0);
			
		for (i = 0; i < instanceArr.length; i += 1) {
			unpauseSound(instanceArr[i]);
		}
	};
	
	// Mute all sound
	speaker.mute = function () {
	
		if (!muted) {
			muted = true;
// TODO: mute all sounds
		}
	};
	
	// Unmute all sound
	speaker.unmute = function () {
	
		if (muted) {
			muted = false;
// TODO: unmute all sounds
		}
	};
	
	speaker.isMuted = function () {
		
		return muted;	
	};
	
	// Load the audio element
	speaker.load = function () {

		if (!loadStarted) {
			loadStarted = true;
			
			createLoadTimer();
			
			load();
		}
	};
	
	// Return if audio is ready to be played
	speaker.isReady = function () {
	
		return ready;
	};
	
	speaker.createSound = function (spec) {
		
		var tmpAudioElement = document.createElement("audio");
		
		//if (sounds[spec.name] && spec.name !== "BlocksTestSound") {
		//	BLOCKS.warn("Sound ('" + spec.name + "') already created. Overriding previous sound.");
		//}
		
		if (spec.extension === undefined || (spec.extension === "caf" && !tmpAudioElement.canPlayType("audio/x-caf")) || (spec.extension === "mp4" && !tmpAudioElement.canPlayType("audio/mp4"))) {
			spec.extension = "mp3";	
		}
		
		sounds[spec.name] = {
			name: spec.name,
			start: spec.start,
			end: spec.end,
			loop: spec.loop
		};
//BLOCKS.debug("Create Sound: " + spec.name);
		if (!files[spec.src + "." + spec.extension]) {
			files[spec.src + "." + spec.extension] = {
				src: spec.src + "." + spec.extension
			};
			loadFile(files[spec.src + "." + spec.extension]);
//BLOCKS.debug("Load Sound: " + spec.src);
		}
		
		sounds[spec.name].file = files[spec.src + "." + spec.extension];
	};
	
	speaker.getActiveSoundInstances = function () {
	
		return instances;
	};
	
	speaker.getNumFiles = function () {
	
		var key, totalNumFiles;

		totalNumFiles = 0;
		
		// Determine load progress
		for (key in files) {
			if (files.hasOwnProperty(key)) {
				totalNumFiles += 1;
			}
		}
		
		return totalNumFiles;
	};
	
	speaker.getNumFilesLoaded = function () {
	
		var key, numFilesLoaded;
			
		numFilesLoaded = 0;
		
		// Determine load progress
		for (key in files) {
			if (files.hasOwnProperty(key)) {
				if (files[key].loaded) {
					numFilesLoaded += 1;
				}
			}
		}
		
		return numFilesLoaded;
	};
	
	speaker.getCurrentTime = function () {
		
		// Since multiple sounds could be playing this returns nothing
		return null;
	};
	
	speaker.destroy = function () {
		
		var key;
		
		for (key in files) {
			if (files.hasOwnProperty(key)) {
				if (files[key].audioElement) {
					files[key].audioElement = null;
				}
			}
		}
	};
	
	speaker.multipleTracksSupported = true;
	
	return speaker;
};

BLOCKS.speaker = function (spec) {
	
	"use strict";
	
	var speaker;
	
	// Create audio element
	(function () {
	
		if (!spec) {
			spec = {};
		}
		
		if (spec.audioPlayerType === "multiAudioElementPlayer") {
			speaker = BLOCKS.audio.multiAudioElementPlayer(spec);
		} else if (spec.audioPlayerType !== "audioElementPlayer" && (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') && spec.webAudioEnabled !== false) {
			speaker = BLOCKS.audio.webAudioPlayer(spec);
		} else {
			speaker = BLOCKS.audio.audioElementPlayer(spec);
		}
	}());
	
	speaker.createSoundsFromTree = function (spec) {
		
		var traverse = function (obj, callback) {
			
			var key, i;
		
			for (key in obj) {

				if (obj.hasOwnProperty(key) && !(obj[key] instanceof HTMLElement)) {
   
					callback.apply(this, [key, obj]);
					if (obj[key] instanceof Object && !(obj[key] instanceof Array)) {
						traverse(obj[key], callback);
					} else if (obj[key] instanceof Array) {
						for (i = 0; i < obj[key].length; i += 1) {
							traverse(obj[key][i], callback);
						}
					}
				}
			}
		};
		
		traverse(spec, function (key, obj) {
			// If no extension then assume it is a sound
			if (key === "src" && obj[key].indexOf(".") === -1) {
				speaker.createSound(obj);
			}
		});
	};
	
	speaker.debug = false;
	
	return speaker;
};
/*
Copyright (c) 2013 William Malone (www.williammalone.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*global window */

var BLOCKS;

if (BLOCKS === undefined) {
	BLOCKS = {};
}

BLOCKS.speaker = function (spriteSrc) {
	
	"use strict";
	
	var that = BLOCKS.eventDispatcher(),
		curSoundSpec,
		initialized = false,
		loadStarted = false,
		loadComplete = false,
		ready = false,
		loadPercentage = 0,
		audioElement,
		loadInterval,
		soundCompleteTimer,
		
		onCanPlay = function () {	
			
			if (!ready) {
				ready = true;
				that.dispatchEvent("ready");
			}
		},
		
		onCanPlayThrough = function () {	
			
			if (!ready) {
				ready = true;
				that.dispatchEvent("ready");
			}
		},
		
		load = function () {

			loadInterval = window.setInterval(function () {
			
				var curLoadTime, curLoadPercentage;
				
				// If sound isn't buffered then no need to update
				if (!audioElement.buffered.length) {
					return;
				}
				
				// Set the current load time to the last buffered item
				curLoadTime = audioElement.buffered.end(audioElement.buffered.length - 1);
		
				// Set the current load percentage    
				curLoadPercentage = curLoadTime / audioElement.duration * 100;
				
				// If a change in the load percentage then dispatch an event
				if (curLoadTime && !isNaN(curLoadPercentage) && loadPercentage !== curLoadPercentage) {
					loadPercentage = curLoadPercentage;
					that.dispatchEvent("loadUpdate");
				}
				
				// Dispatch a load complete event if the difference between the current load time and the audio duration is very small                                                  
				if (window.Math.abs(curLoadTime - audioElement.duration) < 0.1) {
			
					window.clearInterval(loadInterval);
					that.dispatchEvent("loadComplete");
				}
			}, 1000);
			
			audioElement.src = spriteSrc;
			
			// Play and then pause immediately after to initiate a load but not hear the audio
			audioElement.play();
			audioElement.pause();
		},
		
		endSound = function () {
		
			// Clear the sound complete timer
			window.clearInterval(soundCompleteTimer);
			soundCompleteTimer = null;
			curSoundSpec = null;
			audioElement.pause();
		},
		
		soundCompleteChecker = function () {
		
			// If a sound is playing
			if (curSoundSpec) {
				// If the scrubber is past the sound end time then the sound is complete
				if (audioElement.currentTime >= curSoundSpec.endTime) {
					// If the sound is set to loop then move the scrubber to the beginning of the sound
					if (curSoundSpec.loop === true) {
						audioElement.currentTime = curSoundSpec.startTime;
					} else {
						endSound();
					}
					
					that.dispatchEvent("played");
				}
			} else {
				window.clearInterval(soundCompleteTimer);
			}
		};
	
	
	that.play = function (spec) {
	
		if (!spec) {
			audioElement.play();
		} else {
		
			if (spec.startTime > 0 && spec.endTime > 0) {

				// Save the sound specs
				curSoundSpec = spec;
				
				// Move the scrubber to the start of the sound
				audioElement.currentTime = curSoundSpec.startTime;
				
				// Play the sound
				audioElement.play();
				
				// Start a listener to check if the sound is complete
				if (!soundCompleteTimer) {
					soundCompleteTimer = window.setInterval(soundCompleteChecker, 100);
				}
	
			} else {
				BLOCKS.warning("Sound parameters not specified.");
			}
		}
	};
	
	// Pause the audio element and clear the current sound
	that.stop = function () {
	
		endSound();
	};
	
	// Load the audio element
	that.load = function () {
	
		if (!loadStarted) {
			loadStarted = true;
			
			load();
		}
	},

	// Create audio element
	(function () {

		audioElement = window.document.createElement("audio");
		audioElement.addEventListener("canplay", onCanPlay);
		audioElement.addEventListener("canplaythrough", onCanPlayThrough);
		
		// Append source with mp3 extension if supported
		if (audioElement.canPlayType("audio/mpeg")) {
			spriteSrc += ".mp3";
		} else if (audioElement.canPlayType("audio/ogg")) {
			spriteSrc += ".ogg";
		}
	}());
};
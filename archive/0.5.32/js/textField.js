/*
Copyright (c) 2013 William Malone (www.williammalone.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*global window, Image */

var BLOCKS;

if (BLOCKS === undefined) {
	BLOCKS = {};
}

BLOCKS.textField = function (options) {
	
	"use strict";
	
	var textField = BLOCKS.view(options),
		sup = {},
		drawBounds = false, // Used for debug to see the text field's bounding box
		numLines,
		cameraSize,
		motors = [],
		highlighting,
		highlightingIndex,
		highlights = {},
		maxHighlightIndex = 0,
		languages,
		curLanguage = "english",
		isIE,
		
		// Private Method
		motorDestroyed = function (motor) {
			
			var i;
			
			motor.removeEventListener("destroyed", motorDestroyed);
			
			for (i = 0 ; i < motors.length; i += 1)  {
				motors.splice(i, 1);
				break;
			}
		},

		populateParagraphs = function () {
			
			var i, j, newParagraph, str, results, lineCharacterIndex, lastWordStartIndex, key, prevHighlightEndValue, start, end, paragraphs, newline,
			
				charProperties = {
					fontColor: null,
					fontFamily: null,
					fontSize: null,
					fontItalic: null,
					fontWeight: null,
					highlight: null
				},
				
				supportedTags = {
					b: "fontWeight",
					i: "fontItalic",
					hi: "highlight",
					newLine: "newLine"
				},
				
				convertToFrames = function (value) {
					
					return Math.floor(parseFloat(value) * 60);
				},
				
				executeTag = function (tagContents, startTag) {
					
					var contentArray, tagName, tagValueStr, tagValueArr;
					
					contentArray = tagContents.split("=");
					tagName = contentArray[0];			
					if (contentArray.length > 1) {
						tagValueStr = contentArray[1].replace(/"/g, "").replace(/'/g, "");
						tagValueArr = tagValueStr.split(",");
					}

					if (supportedTags[tagName]) {						
						if (tagName === "b" || tagName === "i") {
							charProperties[supportedTags[tagName]] = startTag;
						} else if (tagName === "hi") {
							if (startTag) {
								
								// Set to the first value if there was a comma in the value portion of the tag (e.g. hi="1.2,3.4") otherwise set it to the end value of the previous tag
								start = tagValueArr.length > 1 ? convertToFrames(tagValueArr[0]) : prevHighlightEndValue;
								end = convertToFrames(tagValueArr[tagValueArr.length - 1]);
								
								// Save the end of the highlights
								if (end > maxHighlightIndex) {
									maxHighlightIndex = end;
								}
								
								// Convert from time to frames
								charProperties[supportedTags[tagName]] = {
									start: start,
									end: end
								};
								
								// Save the end value
								prevHighlightEndValue = end;
								
								// Save the start and end times to an object to quickly check  if a highlight has started or ended and then set the textfield to dirty so it will render the change
								highlights[start] = true;
								highlights[end] = true;
							} else {
								charProperties[supportedTags[tagName]] = false;
							}
						}
					}
				};
				
			for (key in languages) {
				
				if (languages.hasOwnProperty(key)) {
					
					paragraphs = languages[key].paragraphs;
			
					for (i = 0; i < paragraphs.length; i += 1) {
		
						paragraphs[i] = {
							text: paragraphs[i]
						};				
						newParagraph = true;
						paragraphs[i].charList = [];
						lastWordStartIndex = 0;
						lineCharacterIndex = 0;
						prevHighlightEndValue = 0;
						newline = false;
						
						while (lineCharacterIndex < paragraphs[i].text.length) {		
		
							// If encountered an end tag
							if (/^<newline>/i.test(paragraphs[i].text.slice(lineCharacterIndex))) {
								
								results = /<newline>/i.exec(paragraphs[i].text.slice(lineCharacterIndex));
//BLOCKS.debug("newline tag found! " + results[1]);	
//BLOCKS.dir(results);
								
								lineCharacterIndex += results[0].length;
								
								newline = true;
								
							} else if (/^<\/(.*?)\>/i.test(paragraphs[i].text.slice(lineCharacterIndex))) {
								
								results = /<\/(.*?)\>/i.exec(paragraphs[i].text.slice(lineCharacterIndex));
//BLOCKS.debug("closing tag found! " + results[1]);	
//BLOCKS.dir(results);
		
								executeTag(results[1].replace("/", ""), false);
								
								lineCharacterIndex += results[0].length;
							
							// If encountered an opening tag
							} else if (/^<(.*?)>/i.test(paragraphs[i].text.slice(lineCharacterIndex))) {
						
								// Get the details of the tag
								results = /<(.*?)>/i.exec(paragraphs[i].text.slice(lineCharacterIndex));
//BLOCKS.debug("opening tag found! " + results[1]);	
//BLOCKS.dir(results);
								
								executeTag(results[1], true);
		
								lineCharacterIndex += results[0].length;
								
							} else {
							
								// If it is a space then remember it's location to tell the next characters what word they belong to
								if (paragraphs[i].text[lineCharacterIndex] === " ") {
									lastWordStartIndex = paragraphs[i].charList.length + 2;	
								}
								
								// Save the character
								paragraphs[i].charList.push({
									character: paragraphs[i].text[lineCharacterIndex],
									wordStartIndex: lastWordStartIndex,
									newParagraph: newParagraph,
									newline: newline,
									style: {}
								});
								
								// Save the current font styles
								for (key in charProperties) {
									paragraphs[i].charList[paragraphs[i].charList.length - 1].style[key] = charProperties[key];
								}
								
								newline = false;
								newParagraph = false;
								lineCharacterIndex += 1;
							}
						}
					}
		
					//str = "";
					//for (i = 0; i < paragraphs.length; i += 1) {
					//	for (j = 0; j < paragraphs[i].charList.length; j += 1) {
					//		str += paragraphs[i].charList[j].character;
					//	}
					//}
					//BLOCKS.debug("str: " + str);
					
				}
			}
		};
		
	textField.update = function () {
		
		if (highlighting) {
			highlightingIndex += 1;
					
			// A highlight has started or ended so a render is needed
			if (highlights[highlightingIndex]) {
				textField.dirty = true;
			}
			
			if (highlightingIndex >= maxHighlightIndex) {
				highlighting = false;
			} 
		}	
	};
	
	// Public Methods
	textField.render = function (e) {
	
		var i, j, bounds, restoreNeeded, wordArr, curLine, newLineIndex, xLoc, yLoc,
			context, cameraOffset, fontStr, x, y, index, paragraphs,
			
			renderCharactersOnThisLine = function (spec) {
				
				var j, fontStr, lineWidth,
				
					loop = function (renderPos) {
						
						var charWidth,
							curWidth = 0;
				
						for (j = spec.startIndex; j < spec.endIndex; j += 1) {
							
							fontStr = "";
		
							if (paragraphs[i].charList[j].style.fontWeight || textField.fontWeight) {
								fontStr += (paragraphs[i].charList[j].style.fontWeight || textField.fontWeight) + " ";
							}
							
							if (paragraphs[i].charList[j].style.fontItalic || textField.fontItalic) {
								fontStr += "italic" + " ";
							}
							fontStr += (Number(textField.fontSize.toString().replace("px", ""))  + "px") + " " + textField.fontFamily;
							context.font = fontStr;
							
							
//BLOCKS.debug(paragraphs[i].charList[j].character + ": fontStr: " + fontStr + " > " + context.measureText(paragraphs[i].charList[j].character).width);
						
							if (renderPos) {
								
								if (spec.stroke) {
									
									// TODO: Move this properties outside of the for loop
									context.strokeStyle = textField.strokeColor;
									context.lineWidth = textField.strokeLineWidth || 10;
									context.lineCap = textField.strokeLineCap || "round";
									context.lineJoin = textField.strokeLineJoin || "round";
									context.strokeText(paragraphs[i].charList[j].character, renderPos.x + curWidth, renderPos.y);
								} else {
		
									if (highlighting && paragraphs[i].charList[j].style.highlight && highlightingIndex >= paragraphs[i].charList[j].style.highlight.start && highlightingIndex < paragraphs[i].charList[j].style.highlight.end) {
										context.fillStyle = textField.highlightColor;
									} else {
										context.fillStyle = textField.fontColor;
									}
									
								
									// Draw this character
									context.fillText(paragraphs[i].charList[j].character, renderPos.x + curWidth, renderPos.y);
								}
							}
							
							charWidth = context.measureText(paragraphs[i].charList[j].character).width;
							
							curWidth += charWidth;
							
							// If Internet Explorer then increase the kerning a little to match other browsers
							if (isIE) {
								curWidth += 0.11;
								//curWidth += charWidth * 0.013;
							}
						}
						
						return curWidth;
					};
					
				// Determine the width of the line (depends on the characters and their style)	
				lineWidth = loop();
			
				// Just return the line width if function called specifing only a measurement
				if (spec.measureOnly === true || spec.y === undefined) {
					return lineWidth;	
				}
				
				// Set the starting horizontal position of the text based on the text alignment
				if (textField.textAlign === "center") {
					x = textField.x - cameraOffset.x - lineWidth / 2;
				} else if (textField.textAlign === "right") {
					x = textField.x - cameraOffset.x + (textField.width || cameraSize.width);
				} else {
					x = textField.x - cameraOffset.x;
				}
					
				y = spec.y;
	
				if (textField.strokeColor) {
					// First draw all the strokes
					loop({
						x: x,
						y: y,
						stroke: true	
					});
				}
				
				loop({
					x: x,
					y: y	
				});
				
				return lineWidth;
			};
		
		if (textField.dirty && textField.visible && textField.alpha !== 0 && textField.layer && textField.scale !== 0 && textField.scaleX !== 0 && textField.scaleY !== 0) {

			cameraOffset = {
				x: (e && e.camera && e.camera.offsetX) || 0,
				y: (e && e.camera && e.camera.offsetY) || 0
			};
			
			cameraSize = {
				width: (e && e.camera && e.camera.width) || 300,
				height: (e && e.camera && e.camera.height) || 150
			};
		
			context = textField.layer.ctx;
			
			if (textField.angle || textField.alpha !== 1 || textField.scaleX !== 1 || textField.scaleY !== 1) {
				context.save();
				restoreNeeded = true;
			}
		
			if (textField.scaleX !== 1 || textField.scaleY !== 1) {
				context.translate(textField.x - cameraOffset.x, textField.y - cameraOffset.y);
				context.scale(textField.scaleX, textField.scaleY);
				context.translate(-(textField.x - cameraOffset.x), -(textField.y - cameraOffset.y));
			}
			
			if (textField.alpha !== 1) {
				context.globalAlpha = textField.alpha;
			}
			
			if (textField.angle) {
				context.translate(textField.x - cameraOffset.x, textField.y - cameraOffset.y);
				context.rotate(textField.angle * Math.PI / 180);
				context.translate(-(textField.x - cameraOffset.x), -(textField.y - cameraOffset.y));
			}
		
			context.textBaseline = textField.textBaseline;

			index = 0;
			yLoc = textField.y - cameraOffset.y;
			numLines = 0;
			
			curLanguage = e.language;

			// Get the current language text
			paragraphs = textField.text;
			for (i = 0; i < paragraphs.length; i += 1) {
			
				curLine = "";
				newLineIndex = 0;
				
				for (j = 0; j < paragraphs[i].charList.length; j += 1) {
					
					curLine += paragraphs[i].charList[j].character;
					
// TODO: To increase accuracy might have to keep track of each character's width since they could be different depending on the font size, weight, etc
	
					// If adding this character makes this line wider than the max width
					//   then render the line and move down an start the next line
					if (j && // If not the first character
						textField.width && // If a width is specified
						renderCharactersOnThisLine({
							startIndex: newLineIndex,
							endIndex: j,
							measureOnly: true	
						}) > textField.width / textField.scaleX || paragraphs[i].charList[j].newline) {  // If current line is wider
						
						// If only one word is on the line then the word has to be broken
						if (paragraphs[i].charList[j].wordStartIndex > newLineIndex) {
						
							// Remove all characters in the word that is outside the textfield width
							curLine = curLine.slice(0, curLine.length - 1 - (j - paragraphs[i].charList[j].wordStartIndex));
							
							// Jump back to the beginning of the word
							j = paragraphs[i].charList[j].wordStartIndex - 2;
						}
						
						renderCharactersOnThisLine({
							startIndex: newLineIndex,
							endIndex: j,
							y: yLoc
						});
						
						// Clear the current line that has been drawn
						curLine = "";

						// If the start of a new line is a space then skip it
						if (paragraphs[i].charList[j].character === " ") {
							newLineIndex = j + 1;
						} else {
							newLineIndex = j;
						}
						
						// Move the vertical position to the next line
						yLoc += textField.lineHeight;
						numLines += 1;
					}
					
					// Prevent crash
					index += 1;
					if (index > 1000) {
						BLOCKS.error("Cannot render textfield. Width maybe smaller than character.");	
						break;
					}
				}
				renderCharactersOnThisLine({
					startIndex: newLineIndex,
					endIndex: j,
					y: yLoc
				});
				numLines += 1;
			}
			
			// Change the bounding box to match the text baseline and the number of lines rendered
			if (textField.textBaseline === "alphabetic") {
				textField.hotspots = [{
					x: 0,
					y: -textField.lineHeight * 0.7,
					width: textField.width / textField.scaleX || cameraSize.width,
					height: textField.lineHeight * numLines
				}];
				if (textField.textAlign === "center") {
					textField.hotspots[0].x = -textField.hotspots[0].width / 2;
				}
			} else {
				textField.hotspots = [{
					x: 0,
					y: 0,
					width: textField.width / textField.scaleX || cameraSize.width,
					height: textField.lineHeight * numLines
				}];
				if (textField.textAlign === "center") {
					textField.hotspots[0].x = -textField.hotspots[0].width / 2;
				}
			}
			
			if (drawBounds) {
				
				bounds = textField.getBounds();
				if (!bounds.length) {
					bounds = [bounds];
				}
				
				textField.height = bounds[0].height || (numLines * textField.lineHeight);
				
				context.lineWidth = 4;

				for (i = 0; i < bounds.length; i += 1) {
					context.beginPath();
					context.strokeStyle = "rgba(255, 10, 255, 0.4)";
					//if (textField.textAlign === "center") {
					//	context.strokeRect(bounds[i].x - cameraOffset.x - (bounds[i].width || cameraSize.width) / 2, bounds[i].y - cameraOffset.y, (bounds[i].width || cameraSize.width), textField.height);
					//} else {
						context.strokeRect(bounds[i].x - cameraOffset.x, bounds[i].y - cameraOffset.y, (bounds[i].width || cameraSize.width), textField.height);
					//}
					context.closePath();
				}
			}
						
			if (restoreNeeded) {
				context.restore();
			}
		}
		textField.dirty = false;
	};
		
	textField.destroy = function () {
		
		textField.stopMotors();
		textField = null;
	};
	
	textField.motorize = function (motor) {
	
		motor.addEventListener("destroyed", motorDestroyed);
		motors.push(motor);
	};
	
	textField.stopMotors = function (type) {
		
		var i, motorArr = motors.slice(0);
		
		for (i = 0 ; i < motorArr.length; i += 1)  {
			if (type) {
				if (motorArr[i].type === type) {
					motorArr[i].destroy();
				}
			} else {
				motorArr[i].destroy();
			}
		}
	};
	
	textField.startHighlighting = function () {
	
		highlighting = true;
		highlightingIndex = 0;
		textField.dirty = true;
	};
	
	textField.stopHighlighting = function () {
	
		highlighting = false;
		highlightingIndex = 0;
		textField.dirty = true;
	};
	
	languages = {};
	Object.defineProperty(textField, "text", {
		get: function () {
			
			// Default to english if the language is missing or not specified
			if (curLanguage === undefined || !languages[curLanguage]) {
				if (languages.english) {
					return languages.english.paragraphs;
				} else {
					BLOCKS.warn("No english version of this text exists.");	
					return [];
				}
			}
			
			return languages[curLanguage].paragraphs;
		},
		set: function (value) {
			
			var key;
			
			// Supported value type are string, array of paragraphs or object of languages
			if (typeof value === "string") {
				
				languages.english = {};
				languages.english.paragraphs = [value];
				
				languages.english.paragraphs = languages.english.paragraphs.slice(0);
			} else if (Array.isArray(value)) {
				
				languages.english = {};
				languages.english.paragraphs = value;
				
				// Make a copy of the paragraphs array so the original is not changed
				languages.english.paragraphs = languages.english.paragraphs.slice(0);
			} else {
				// Value is an object so assuming properties are language labels
				for (key in value) {
					
					if (value.hasOwnProperty(key)) {
						languages[key] = {};
						languages[key].paragraphs = value[key];
						
						if (typeof languages[key].paragraphs === "string") {
							languages[key].paragraphs = [languages[key].paragraphs];
						}
						// Make a copy of the paragraphs array so the original is not changed
						languages[key].paragraphs = languages[key].paragraphs.slice(0);
					}
				}
			}

			populateParagraphs();
			textField.dirty = true;
		}
	});
	
	Object.defineProperty(textField, "numLines", {
		get: function () {
			return numLines;
		}
	});
	
	(function () {
		
		var isBrowserIE = function () {
			
			var ua = window.navigator.userAgent;
			
			// IE 10 or lower
			if (ua.indexOf('MSIE ') > 0) {
				return true;
			}
			
			// IE 11
			if (ua.indexOf('Trident/') > 0) {
				return true;
			}
			
			// IE 12+ (Edge)
			if (ua.indexOf('Edge/') > 0) {
				return true;
			}
			
			return false;
		};
		
		options = options || {};
		
		textField.fontColor = options.fontColor || options.color || "#000000";
		textField.fontFamily = options.fontFamily || "Arial,sans";
		textField.fontSize = (options.fontSize && Number(options.fontSize.toString().replace("px", ""))) || 24;
		textField.fontWeight = options.fontWeight;
		textField.fontItalic = options.fontItalic;
		textField.textAlign = options.textAlign || options.align || "left";
		textField.textBaseline = options.textBaseline || "top";
		textField.lineHeight = options.lineHeight || textField.fontSize;
		textField.paragraphSpacing = options.paragraphSpacing || 10;
		textField.highlightColor = options.highlightColor || "#999999";
		
		// Make sure the text is set last
		textField.text = options.text || "";
		
		isIE = isBrowserIE();
	}());
	
	return textField;
};
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
		paragraphs,
		numLines,
		cameraSize,
		motors = [],
		
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
			
			var i, j, newParagraph, str, results, lineCharacterIndex, lastWordStartIndex, key,
			
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
					hi: "highlights",
					newLine: "newLine"
				},
				
				executeTag = function (tagContents, startTag) {
					
					var contentArray, tagName, tagValues;
					
					contentArray = tagContents.split("=");
					tagName = contentArray[0];			
					if (contentArray.length > 1) {
						tagValues = contentArray[1];	
					}

					if (supportedTags[tagName]) {						
						if (tagName === "b" || tagName === "i") {
							charProperties[supportedTags[tagName]] = startTag;
						}
					} else {
//BLOCKS.debug("tag not supported: " + tagName);	
					}
				};
			
			for (i = 0; i < paragraphs.length; i += 1) {
//BLOCKS.dir(paragraphs[i]);

				paragraphs[i] = {
					text: paragraphs[i]
				};				
				newParagraph = true;
				paragraphs[i].charList = [];
				lastWordStartIndex = 0;
				lineCharacterIndex = 0;
				
				while (lineCharacterIndex < paragraphs[i].text.length) {
//BLOCKS.dir(paragraphs[i].text.slice(lineCharacterIndex));				

					// If encountered an end tag
					if (/^<\/(.*?)\>/i.test(paragraphs[i].text.slice(lineCharacterIndex))) {
						
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
							style: {}
						});
						
						// Save the current font styles
						for (key in charProperties) {
							paragraphs[i].charList[paragraphs[i].charList.length - 1].style[key] = charProperties[key];
						}
						
						newParagraph = false;
						lineCharacterIndex += 1;
					}
				}
			}
			
			/*
			str = "";
			for (i = 0; i < paragraphs.length; i += 1) {
				for (j = 0; j < paragraphs[i].charList.length; j += 1) {
					str += paragraphs[i].charList[j].character;
				}
			}
			BLOCKS.debug("str: " + str);
			*/
		};
	
	// Public Methods
	textField.render = function (e) {
	
		var i, j, bounds, restoreNeeded, wordArr, curLine, newLineIndex, xLoc, yLoc,
			context, cameraOffset, fontStr, x, y, index,
			
			renderCharactersOnThisLine = function (spec) {
				
				var j, fontStr, lineWidth,
				
					loop = function (renderPos) {
						
						var curWidth = 0;
				
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
								
									context.fillStyle = textField.fontColor;
								
									// Draw this chracter
									context.fillText(paragraphs[i].charList[j].character, renderPos.x + curWidth, renderPos.y);
								}
							}
							
							curWidth += context.measureText(paragraphs[i].charList[j].character).width;
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
						}) > textField.width / textField.scaleX) {  // If current line is wider
						
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
			}
			
			if (drawBounds) {
				
				bounds = textField.getBounds();
				if (!bounds.length) {
					bounds = [bounds];
				}
				
				context.lineWidth = 4;
				
				for (i = 0; i < bounds.length; i += 1) {
					context.beginPath();
					context.strokeStyle = "rgba(255, 10, 255, 0.4)";
					if (textField.textAlign === "center") {
						context.strokeRect(bounds[i].x - cameraOffset.x - (bounds[i].width || cameraSize.width) / 2, bounds[i].y - cameraOffset.y, (bounds[i].width || cameraSize.width), bounds[i].height || (numLines * textField.lineHeight));
					} else {
						context.strokeRect(bounds[i].x - cameraOffset.x, bounds[i].y - cameraOffset.y, (bounds[i].width || cameraSize.width), bounds[i].height || (numLines * textField.lineHeight));
					}
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
	
	textField.startHighlighting = function (type) {
		
		
	};
	
	paragraphs = [];
	Object.defineProperty(textField, "text", {
		get: function () {
			return paragraphs;
		},
		set: function (value) {

			paragraphs = value;

			if (typeof paragraphs === "string") {
				paragraphs = [paragraphs];
			}
			
			// Make a copy of the paragraphs array so the original is not changed
			paragraphs = paragraphs.slice(0);

			populateParagraphs();
			textField.dirty = true;
		}
	});
	
	(function () {
		
		options = options || {};
		
		textField.fontColor = options.fontColor || "#000000";
		textField.fontFamily = options.fontFamily || "Arial,sans";
		textField.fontSize = (options.fontSize && Number(options.fontSize.toString().replace("px", ""))) || 24;
		textField.fontWeight = options.fontWeight;
		textField.fontItalic = options.fontItalic;
		textField.textAlign = options.textAlign || "left";
		textField.textBaseline = options.textBaseline || "top";
		textField.lineHeight = options.lineHeight || 10;
		textField.paragraphSpacing = options.paragraphSpacing || 10;
		textField.highlightColor = options.highlightColor || "#999999";
		
		// Make sure the text is set last
		textField.text = options.text || "";
	}());
	
	return textField;
};
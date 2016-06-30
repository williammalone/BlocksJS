/*
Copyright (c) 2015 William Malone (www.williammalone.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*global window */

var BLOCKS;

if (BLOCKS === undefined) {
	BLOCKS = {};
}

BLOCKS.storybookPage = function (options, language) {
	
	"use strict";
	
	var page = BLOCKS.gear(),
		layer,
		alpha,
		visible,
		bg,
		//scaleX,
		items = [],
		children = {},
		
		setViewsProperty = function (property, value) {
			
			var i;
		
			if (bg) {
				bg[property] = value;
			}
				
			for (i = 0; i < items.length; i += 1) {
				items[i][property] = value;
			}
		},
		
		getViewsDirty = function () {
			var i;

			if (bg && bg.dirty) {
				return true;	
			}

			for (i = 0; i < items.length; i += 1) {
				if (items[i].dirty) {
					return true;	
				}
			}
			return false;
		};
		
	page.x = 0;
	page.y = 0;
	page.scaleX = 1;
	page.scaleY = 1;
	page.turnRatio = 1;
		
	page.destroy = function () {
		
		options = null;
		items = null;
		page = null;
	};
	
	// Public Methods
	page.update = function () {
	
		var i;
		
		// If the turn ratio is really small make it zero to hide the elements
		if (Math.abs(page.turnRatio) < 0.001) {
			page.turnRatio = 0;
		}
	
		if (bg) {
			bg.scaleX = bg.world.scale * page.turnRatio * page.scaleX;
			bg.scaleY = bg.world.scale * page.scaleY;
			bg.x = page.x + bg.world.x * page.turnRatio * page.scaleX;
			bg.y = page.y + bg.world.y * page.scaleY;
			bg.update();
		}

		for (i = 0; i < items.length; i += 1) {
			items[i].scaleX = items[i].world.scale * page.turnRatio * page.scaleX;
			items[i].scaleY = items[i].world.scale * page.scaleY;
			items[i].x = page.x + items[i].world.x * page.turnRatio * page.scaleX;
			items[i].y = page.y + items[i].world.y * page.scaleY;
			items[i].update();
		}
	};
	
	page.render = function (e) {
		
		var i;
	
		if (bg) {
			bg.render(e);
		}
	
		for (i = 0; i < items.length; i += 1) {
			items[i].render(e);
		}
	};
	
	page.startHighlighting = function () {
		
		var i;
	
		for (i = 0; i < items.length; i += 1) {
			if ((options.content[i].type === "textarea" || options.content[i].text !== undefined) && items[i].startHighlighting) {
				items[i].startHighlighting();
			}
		}
	},
	
	page.stopHighlighting = function () {
		
		var i;
	
		for (i = 0; i < items.length; i += 1) {
			if ((options.content[i].type === "textarea" || options.content[i].text !== undefined) && items[i].startHighlighting) {
				items[i].stopHighlighting();
			}
		}
	},
	
	page.getChildren = function () {
		
		return children;
	};
	
	page.getChild = function (name) {
		
		return children[name];
	};
	
	// Public Properties
	layer = options.layer;
	Object.defineProperty(page, "layer", {
		get: function () {
			return layer;
		},
		set: function (value) {

			if (layer !== value) {
				
				layer = value;
				setViewsProperty("layer", value);
				setViewsProperty("dirty", true);
			}
		}
	});
	
	visible = true;
	Object.defineProperty(page, "visible", {
		get: function () {
			return visible;
		},
		set: function (value) {

			if (visible !== value) {
				
				visible = value;
				setViewsProperty("visible", value);
			}
		}
	});
	
	alpha = 1;
	Object.defineProperty(page, "alpha", {
		get: function () {
			return alpha;
		},
		set: function (value) {

			if (alpha !== value) {
					
				alpha = value;
				setViewsProperty("alpha", value);
				setViewsProperty("dirty", true);
			}
		}
	});
	
	Object.defineProperty(page, "dirty", {
		get: function () {
			return getViewsDirty();
		},
		set: function (value) {	
			setViewsProperty("dirty", value);
		}
	});
	
	(function () {
		
		var i, key, item, spec,
		
			getSpecWithLanguageSupport = function (spec) {
				
				var key,
					newSpec = {};
					
				if (spec) {
				
					for (key in spec) {
						if (spec.hasOwnProperty(key)) {
							newSpec[key] = spec[key];
						}
					}
					// Support different specs for different languages
					if (language && spec[language]) {
						for (key in spec[language]) {
							if (spec[language].hasOwnProperty(key)) {
								newSpec[key] = spec[language][key];
							}
						}
					} else if (spec.english) {
						for (key in spec.english) {
							if (spec.english.hasOwnProperty(key)) {
								newSpec[key] = spec.english[key];
							}
						}
					}
					
					return newSpec;
				}
			};
		
		options = options || {};
		
		spec = getSpecWithLanguageSupport(options.background || options.bg);
		
		if (options.background) {
			bg = BLOCKS.slice(spec);
		}

		if (bg) {
			bg.world = {
				x: bg.x || 0,
				y: bg.y || 0,
				scale: 1	
			};
			if (bg.name) {
				children[bg.name] = bg;
			} else {
				children.background = bg;
			}
		}
		
		// For each content item on the page
		if (options && options.content) {
			for (i = 0; i < options.content.length; i += 1) {
				
				spec = getSpecWithLanguageSupport(options.content[i]);

				if (spec.slices) {
					
					item = BLOCKS.block(spec);
					
				} else if (spec.src) {
					
					item = BLOCKS.slice(spec);					
				} else if (spec.type === "textarea" || spec.text !== undefined) {
					
					item = BLOCKS.textField(spec);	
				}
				// Save the initial properties so they can be reset
				item.start = {
					x: item.x || 0,
					y: item.y || 0,
					scale: item.scale || 1
				};
				// Save the properties since the item will be in the storybook coordinate space
				item.world = {
					x: item.start.x,
					y: item.start.y,
					scale: item.scale
				};
				// Reset the item's scale since it was assigned to the world property (don't want it on the item and again on the world - see the render method)
				item.scale = 1;
				
				// Add the item to the items array
				items.push(item);
				
				if (item.name) {
					if (children[item.name]) {	
						BLOCKS.warn("Duplication children name on storybook page: " + item.name);
					} else {
						children[item.name] = item;
					}
				}
			}	
		}
	}());
	
	return page;
};

BLOCKS.storybook = function (storybookSpec, collectionSpec, language) {
	
	"use strict";
	
	var storybook = BLOCKS.gear(),
		drawBounds = false,
		
		book, element, parentElement, layer, visible, scaleX, scaleY, width, height, bookWidth, bookHeight, x, y, curPageNum, navigating, pages, motors, debugShowAllPages, board, overlay, cover, fauxPageBending, pageShadow,
		
		setViewsDirty = function (value) {
			
			var i;
			
			for (i = 0; i < pages.length; i += 1) {
				pages[i].dirty = value;
			}
		},
		
		getViewsDirty = function () {
			
			var i;
			
			for (i = 0; i < pages.length; i += 1) {
				if (pages[i].visible) {
					if (pages[i].dirty) {
						return true;	
					}
				}
			}
			return false;
		},
		
		// Private Methods
		
		updatePageVisibility = function () {
			
			var i;
	
			for (i = 0; i < pages.length; i += 1) {

				pages[i].visible = Boolean(debugShowAllPages || 
					visible && 
					(!navigating && (i === curPageNum || i === curPageNum - 1)) || 
					(navigating && (i === navigating.curPageNum || i === navigating.middlePageNum || i === navigating.targetPageNum || i === navigating.prevPageNum)));
			}
		},
		
		updateBoard = function (pageNum) {
		
			// If the cover is about to be shown
			if (pageNum === 0) {
				if (overlay) {
					overlay.visible = false;
				}
				if (board) {
					board.visible = Boolean(board.getSlice().name === "cover");
					board.setSlice("cover");
				}
			} else {
				if (overlay) {
					overlay.visible = true;
				}
				if (board) {
					board.visible = Boolean(board.getSlice().name === "open");
					board.setSlice("open");
				}
			}	
		},
		
		turnPage = function (spec) {
			
			var scaleAmount;
			
			if (!spec || !spec.page) {
				BLOCKS.error("turnPage function requires a page to turn");	
			}
			
			// Determine the scale of the page (flipped horizontally if negative)
			scaleAmount = (spec.direction === "left" || spec.direction === -1) ? -1 : 1;
			
			if (storybook.pageTurnDuration === 0) {
				
				if (overlay) {
					overlay.setSlice(Math.floor(navigating.targetPageNum / 2));
				}
				
				spec.page.turnRatio = scaleAmount;
						
				if (spec.callback) {
					spec.callback();	
				}
				// No page turn animation so return
				return;
			}
			
			// Animate the page to look like it is turning
			spec.page.turning = true;
			if (pageShadow) {
				pageShadow.visible = true;
			}

			spec.page.motorize(BLOCKS.motor({
				object: spec.page,
				type: "turnRatio",
				amount: scaleAmount,
				duration: storybook.pageTurnDuration,
				clock: storybook,
				callback: function () {
			
					spec.page.turning = false;
					if (pageShadow) {
						pageShadow.visible = false;
					}
					
					if (spec.callback) {
						spec.callback();	
					}
					updatePageVisibility();
				}
			}));
			
			// If not the cover and faux page bending is enabled (Note: faux page
			//   beind is often used with an overlay to give the illussion of
			//   pages that are rounded on the top or bottom
			if (spec.page !== pages[0] && fauxPageBending) {
				
				if (fauxPageBending.pageScaleY) {
					
					if (scaleAmount === -1) {
						spec.page.scaleY = storybook.scaleY;
					} else {
						spec.page.scaleY = storybook.scaleY + scaleAmount * fauxPageBending.pageScaleY;
					}
					spec.page.motorize(BLOCKS.motor({
						object: spec.page,
						type: "scaleY",
						amount: -scaleAmount * fauxPageBending.pageScaleY,
						duration: storybook.pageTurnDuration,
						clock: storybook
					}));
				}
				if (fauxPageBending.pageMoveY) {
					if (scaleAmount === -1) {
						spec.page.y = storybook.y;
					} else {
						spec.page.y = storybook.y - scaleAmount * fauxPageBending.pageMoveY;
					}
					spec.page.motorize(BLOCKS.motor({
						object: spec.page,
						type: "y",
						amount: scaleAmount * fauxPageBending.pageMoveY,
						duration: storybook.pageTurnDuration,
						clock: storybook
					}));
				}
			}
		},
		
		renderPageShadow = function (e, turningPage) {
			
			var turnRatio;
			
			if (pageShadow && turningPage.dirty) {
				
				turnRatio = turningPage.turnRatio * 1.5;
				if (turningPage.turnRatio < 0) {

					pageShadow.mirrorX = true;
					if (turnRatio < -1) {
						turnRatio = -1;	
					}
					pageShadow.scaleX = storybook.scaleX * turnRatio;
					pageShadow.x = storybook.x + pageShadow.width;
				} else {
					pageShadow.mirrorX = false;
					
					if (turnRatio > 1) {
						turnRatio = 1;
					}
					pageShadow.scaleX = storybook.scaleX * turnRatio;
					pageShadow.x = storybook.x;	
				}
				
				// If the cover is not turning and the left page
				if (turningPage !== cover && turningPage.turnRatio < 0 && fauxPageBending) {
					if (fauxPageBending.pageScaleY) {
						pageShadow.scaleY = 1 + fauxPageBending.pageScaleY;
					}
					if (fauxPageBending.pageScaleY)
					pageShadow.y = storybook.y - fauxPageBending.pageMoveY;
				} else {
					pageShadow.scaleY = turningPage.scaleY;
					pageShadow.y = storybook.y;
				}
				
				pageShadow.dirty = true;
				pageShadow.render(e);
			}
		};
		
	storybook.pageTurnDuration = (collectionSpec.book && collectionSpec.book.pageTurnDuration !== undefined) ? collectionSpec.book.pageTurnDuration : 1000;
	
	// Public Methods
	storybook.update = function () {
		
		var i;
		
		storybook.dispatchEvent("tick");

		// Update all the pages
		for (i = 0; i < pages.length; i += 1) {
			if (pages[i].visible) {
				pages[i].update();
			}
		}
		
		if (cover) {
			cover.update();
		}
		if (board) {
			board.update();
		}
		if (overlay) {
			overlay.update();
		}
		if (pageShadow) {
			pageShadow.update();	
		}
	};
	
	storybook.render = function (e) {
		
		var i, renderNeeded;
		
		if (getViewsDirty() || (board && board.dirty) || (overlay && overlay.dirty) || (cover && cover.dirty) || (pageShadow && pageShadow.dirty)) {
			
			renderNeeded = true;
			// Mark all pages dirty 
			setViewsDirty(true);	
		}
		
		// If any of the pages are dirty then render the board
		if (board && renderNeeded) {		
			board.dirty = true;
			board.render(e);
		}
		
		// Render the pages on the left
		for (i = 0; i < pages.length; i += 1) {
			// If even
			if (i % 2) {
				if (pages[i].visible) {
					if (pages[i].turning) {
						renderPageShadow(e, pages[i]);
					}
					pages[i].render(e);
				}
			}
		}
		// Render the pages on the right but in reverse order so the first pages are on top
		for (i = pages.length - 1; i >= 0; i -= 1) {
			// If odd
			if (i % 2 === 0 || i === 0) {
				if (pages[i].visible) {
					if (pages[i].turning) {
						renderPageShadow(e, pages[i]);
					}
					pages[i].render(e);
				}
			}
		}
		
		// If any of the pages are dirty then render the overlay
		if (overlay && renderNeeded) {		
			overlay.dirty = true;
			overlay.render(e);
		}
		
		// If any of the pages are dirty then render the cover
		if (cover && renderNeeded) {		
			cover.dirty = true;
			cover.render(e);
		}
			
		// For debug only: Draw a rectangle around the storybook bounds
		if (drawBounds) {	
			(function () {
		
				var context,
			
					cameraOffset = {
						x: (e && e.camera && e.camera.offsetX) || 0,
						y: (e && e.camera && e.camera.offsetY) || 0
					};
			
				context = layer.ctx;
				
				context.beginPath();
				context.strokeStyle = "rgba(244, 244, 244, 0.5)";
				context.strokeRect((storybook.x - cameraOffset.x), 
					(storybook.y - cameraOffset.y), 
					storybook.width, 
					storybook.height);
				context.closePath();
			}());
		}
	};
		
	storybook.destroy = function () {
		
		storybook.stopMotors();
		collectionSpec = null;
		storybookSpec = null;
		storybook = null;
	};
	
	storybook.back = function () {
		
		// If not at the beginning of the book
		if (!navigating) {
			
			if (curPageNum - 2 >= 0) {
			
				navigating = {
					curPageNum: curPageNum,
					middlePageNum: curPageNum - 1,
					targetPageNum: curPageNum - 2,
					prevPageNum: curPageNum - 3
				};
	
//BLOCKS.debug("Turn to page: " + (navigating.curPageNum + 1));
	
				pages[navigating.middlePageNum].turnRatio = -1;
				pages[navigating.targetPageNum].turnRatio = 0;
				turnPage({
					page: pages[navigating.middlePageNum],
					direction: "right", 
					callback: function () {
						
						updateBoard(navigating.targetPageNum);
						
						turnPage({
							page: pages[navigating.targetPageNum], 
							direction: "right", 
							callback: function () {
							
								storybook.dispatchEvent("previousPageEnd", navigating.targetPageNum);
								
								// Update the current page
								curPageNum = navigating.targetPageNum;
								navigating = null;
							}
						});
					}
				});
				
				updatePageVisibility();
			}
		}		
	},
	
	storybook.next = function () {
		
		// If not at the end of the book
		if (!navigating && curPageNum + 2 <= pages.length) {
			
			navigating = {
				prevPageNum: curPageNum - 1,
				curPageNum: curPageNum,
				middlePageNum: curPageNum + 1,
				targetPageNum: curPageNum + 2
			};

//BLOCKS.debug("Turn to page: " + (navigating.curPageNum + 1));

			pages[navigating.middlePageNum].turnRatio = 0;
			turnPage({
				page: pages[navigating.curPageNum], 
				direction: "left",
				callback: function () {

					updateBoard(navigating.targetPageNum);
					
					turnPage({
						page: pages[navigating.middlePageNum], 
						direction:"left", 
						callback: function () {
							
							storybook.dispatchEvent("nextPageEnd", navigating.targetPageNum);
						
							// Update the current page
							curPageNum = navigating.targetPageNum;
							navigating = null;
						}
					});
				}
			});
			
			updatePageVisibility();
		}
	},
	
	storybook.prevPage = function () {
		
		if (book.getCurrentPageNum() > 1) {
		
			book.previousPage();
			return true;
		}
		
		return false;
	};
	
	storybook.nextPage = function () {

		if (book.getCurrentPageNum() < book.getNumPages() - 3) {
			
			book.nextPage();
			return true;
		}
		
		return false;
	};
	
	storybook.destroy = function () {

		if (book) {
			book.destroy();	
		}
	};
	
	storybook.startHighlighting = function (pageNum) {

		return pages[pageNum !== undefined ? pageNum : curPageNum].startHighlighting();
	};
	
	storybook.stopHighlighting = function (pageNum) {

		return pages[pageNum !== undefined ? pageNum : curPageNum].stopHighlighting();
	};
	
	storybook.getChildren = function (pageNum) {

		return pages[pageNum !== undefined ? pageNum : curPageNum].getChildren();
	};
	
	storybook.getChild = function (name, pageNum) {
		return pages[pageNum !== undefined ? pageNum : curPageNum].getChild(name);
	};
	
	Object.defineProperty(storybook, "numberOfPages", {
		get: function () {
			if (cover) {
				return pages.length - 1;
			}
			return pages.length;
		}
	});
	
	Object.defineProperty(storybook, "targetPageNum", {
		get: function () {
			return navigating && navigating.targetPageNum;
		}
	});
	
	Object.defineProperty(storybook, "curPageNum", {
		get: function () {
			return curPageNum;
		}
	});
	
	Object.defineProperty(storybook, "overlay", {
		get: function () {
			return overlay;
		},
		set: function (value) {
			
			if (overlay !== value) {
				
				overlay = value;
				
				setViewsDirty(true);
			}
		}
	});

	Object.defineProperty(storybook, "layer", {
		get: function () {
			return layer;
		},
		set: function (value) {
			
			var i;
			
			if (layer !== value) {
				
				layer = value;
				
				for (i = 0 ; i < pages.length; i += 1)  {
					pages[i].layer = value;
				}
				
				if (board) {
					board.layer = value;	
				}
				if (overlay) {
					overlay.layer = value;	
				}
				if (pageShadow) {
					pageShadow.layer = value;
				}
			}
		}
	});
	
	visible = true;
	Object.defineProperty(storybook, "visible", {
		get: function () {
			return visible;
		},
		set: function (value) {

			if (visible !== value) {
				
				visible = value;
				
				updatePageVisibility();
			}
		}
	});
	
	x = 0;
	Object.defineProperty(storybook, "x", {
		get: function () {
			return x;
		},
		set: function (value) {
			
			var i;
			
			if (x !== value) {			
				x = value;
				
				for (i = 0 ; i < pages.length; i += 1)  {
					pages[i].x = value;
				}
				
				if (board) {
					board.x = value;	
				}
				if (overlay) {
					overlay.x = value;	
				}
				if (pageShadow) {
					pageShadow.x = value;
				}
			}
		}
	});
	
	y = 0;
	Object.defineProperty(storybook, "y", {
		get: function () {
			return y;
		},
		set: function (value) {
			
			var i;
			
			if (y !== value) {			
				y = value;
				
				for (i = 0 ; i < pages.length; i += 1)  {
					pages[i].y = value;
				}
				
				if (board) {
					board.y = value;	
				}
				if (overlay) {
					overlay.y = value;	
				}
				if (pageShadow) {
					pageShadow.y = value;
				}
			}
		}
	});
	
	width = (collectionSpec.book && collectionSpec.book.pageWidth) || 1024;
	Object.defineProperty(storybook, "width", {
		get: function () {
			return width * storybook.scaleX;
		}
	});
	
	height = (collectionSpec.book && collectionSpec.book.pageHeight) || 768;
	Object.defineProperty(storybook, "height", {
		get: function () {
			return height * storybook.scaleY;
		}
	});
	
	scaleX = 1;
	Object.defineProperty(storybook, "scaleX", {
		get: function () {
			return scaleX;
		},
		set: function (value) {
			
			var i;
			
			if (scaleX !== value) {			
				scaleX = value;
				
				for (i = 0 ; i < pages.length; i += 1)  {
					pages[i].scaleX = value;
				}
			
				if (board) {
					board.scaleX = value;	
				}
				if (overlay) {
					overlay.scaleX = value;
				}
				if (pageShadow) {
					pageShadow.scaleX = value;
				}
			}
		}
	});
	
	scaleY = 1;
	Object.defineProperty(storybook, "scaleY", {
		get: function () {
			return scaleY;
		},
		set: function (value) {
			
			var i;

			if (scaleY !== value) {
				
				scaleY = value;
				
				for (i = 0 ; i < pages.length; i += 1)  {
					pages[i].scaleY = value;
				}
				
				if (board) {
					board.scaleY = value;	
				}
				if (overlay) {
					overlay.scaleY = value;
				}
				if (pageShadow) {
					pageShadow.scaleY = value;
				}
			}
		}
	});
	
	Object.defineProperty(storybook, "dirty", {
		get: function () {
			return getViewsDirty();
		},
		set: function (value) {
		
			setViewsDirty(value);
		}
	});
	
	(function () {
		
		var i, y, page;

		y = 0;	
		motors = [];
		pages = [];

		if (storybookSpec.cover) {
			pages[0] = BLOCKS.storybookPage(storybookSpec.cover, language);
			cover = pages[0];
		} else {
			BLOCKS.error("BLOCKS storybook requires a cover property in the the storybook object");
		}

		// Add each page of the storybook
		for (i = 0; i < storybookSpec.pages.length; i += 1) {
			
			page = BLOCKS.storybookPage(storybookSpec.pages[i], language);
			
			if (page) {
				if (debugShowAllPages) {
					page.y -= 10 * Math.ceil(storybookSpec.pages.length / 2);
					page.y += y;
					page.alpha = 0.8;
				}
				
				// If even
				if (i % 2 === 0) {
					page.turnRatio = -1;
				} else {
					if (debugShowAllPages) {
						y += 10;
					}
				}
			}
			pages.push(page);
		}
		
		fauxPageBending = collectionSpec.book.fauxPageBending;

		if (collectionSpec.book.board) {
			board = BLOCKS.block(collectionSpec.book.board);
			board.layer = layer;
			board.x = storybook.x;
			board.y = storybook.y;
			board.scaleX = storybook.scaleX;
			board.scaleY = storybook.scaleY;
		}
		
		if (collectionSpec.book.overlay) {
			overlay = BLOCKS.block(collectionSpec.book.overlay);
			overlay.layer = layer;
			overlay.x = storybook.x;
			overlay.y = storybook.y;
			overlay.scaleX = storybook.scaleX;
			overlay.scaleY = storybook.scaleY;
		}
		
		if (collectionSpec.book.pageShadow) {
			pageShadow = BLOCKS.slice(collectionSpec.book.pageShadow);
			pageShadow.layer = layer;
			pageShadow.x = storybook.x;
			pageShadow.y = storybook.y;
			pageShadow.scaleX = storybook.scaleX;
			pageShadow.scaleY = storybook.scaleY;
			if (pageShadow) {
				pageShadow.visible = false;
			}
		}
		
		if (cover) {
			curPageNum = (collectionSpec.book.startOnSpread * 2) || 0;
		} else {
			curPageNum = (collectionSpec.book.startOnSpread * 2) || 1;
		}
		updateBoard(curPageNum);
		
		// Hide pages not visible
		updatePageVisibility();
	}());
	
	return storybook;
};
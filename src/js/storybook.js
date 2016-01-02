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

BLOCKS.storybookPage = function (options) {
	
	"use strict";
	
	var page = BLOCKS.gear(),
		sup = {},
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
		
		var i, item, spec;
		
		options = options || {};
		
		if (options.background) {
			bg = BLOCKS.slice(options.background);
		} else if (options.bg) {
			bg = BLOCKS.slice(options.bg);
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

				if (options.content[i].slices) {
					
					spec = options.content[i];
					item = BLOCKS.block(spec);
					
				} else if (options.content[i].src) {
					
					spec = options.content[i];
					item = BLOCKS.slice(spec);					
				} else if (options.content[i].type === "textarea" || options.content[i].text !== undefined) {
					
					spec = options.content[i];
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

BLOCKS.storybook = function (storybookSpec, collectionSpec) {
	
	"use strict";
	
	var storybook = BLOCKS.gear(),
		sup = {},
		drawBounds = false,
		book,
		element,
		parentElement,
		layer,
		visible,
		scaleX,
		scaleY,
		width,
		height,
		bookWidth,
		bookHeight,
		x,
		y,
		curPageIndex,
		navigating,
		pages = [],
		motors = [],
		debugShowAllPages,
		
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

//BLOCKS.debug("updatePageVisibility ----------");		
			for (i = 0; i < pages.length; i += 1) {

				pages[i].visible = Boolean(debugShowAllPages || 
					visible && 
					(!navigating && (i === curPageIndex || i === curPageIndex - 1)) || 
					(navigating && (i === navigating.curPageIndex || i === navigating.middlePageIndex || i === navigating.targetPageIndex || i === navigating.prevPageIndex)));

//if (pages[i].visible) {				
//	BLOCKS.debug("page " + i + ": " + pages[i].visible);
//}
			}
//BLOCKS.debug("-------------------------------");
		},
		
		turnPage = function (spec) {
			
			var scaleAmount;
			
			if (!spec || !spec.page) {
				BLOCKS.error("turnPage function requires a page to turn");	
			}
			
			scaleAmount = (spec.direction === "left" || spec.direction === -1) ? -1 : 1;
			
			// Animate the page to look like it is turning
			spec.page.turning = true;
			spec.page.motorize(BLOCKS.motor({
				object: spec.page,
				type: "turnRatio",
				amount: scaleAmount,
				duration: storybook.pageTurnDuration,
				clock: storybook,
				callback: function () {
					spec.page.turning = false;
					
					if (spec.callback) {
						spec.callback();	
					}
					updatePageVisibility();
				}
			}));
		};
		
	storybook.pageTurnDuration = 1000;
	
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
	};
	
	storybook.render = function (e) {
		
		var i;
		
		// Render the pages on the left
		for (i = 0; i < pages.length; i += 1) {
			// If odd
			if (i % 2 === 0 || i === 0) {
				if (pages[i].visible) {
					pages[i].render(e);
				}
			}
		}
		// Render the pages on the right but in reverse order so the first pages are on top
		for (i = pages.length - 1; i >= 0; i -= 1) {
			// If even
			if (i % 2) {
				if (pages[i].visible) {
					pages[i].render(e);
				}
			}
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
		
		// If not at the end of the book
		if (!navigating && curPageIndex - 2 > 0) {
			
			navigating = {
				curPageIndex: curPageIndex,
				middlePageIndex: curPageIndex - 1,
				targetPageIndex: curPageIndex - 2,
				prevPageIndex: curPageIndex - 3
			};

//BLOCKS.debug("Turn to page: " + (navigating.curPageIndex + 1));

			pages[navigating.middlePageIndex].turnRatio = -1;
			pages[navigating.targetPageIndex].turnRatio = 0;
			turnPage({
				page: pages[navigating.middlePageIndex],
				direction: "right", 
				callback: function () {
					turnPage({
						page: pages[navigating.targetPageIndex], 
						direction: "right", 
						callback: function () {
						
							storybook.dispatchEvent("previousPageEnd", navigating.targetPageIndex);
							
							// Update the current page
							curPageIndex = navigating.targetPageIndex;
							navigating = null;
						}
					});
				}
			});
			
			updatePageVisibility();
		}		
	},
	
	storybook.next = function () {
		
		// If not at the end of the book
		if (!navigating && curPageIndex + 2 <= pages.length) {
			
			navigating = {
				prevPageIndex: curPageIndex - 1,
				curPageIndex: curPageIndex,
				middlePageIndex: curPageIndex + 1,
				targetPageIndex: curPageIndex + 2
			};

//BLOCKS.debug("Turn to page: " + (navigating.curPageIndex + 1));

			pages[navigating.middlePageIndex].turnRatio = 0;
			turnPage({
				page: pages[navigating.curPageIndex], 
				direction: "left",
				callback: function () {
					
					turnPage({
						page: pages[navigating.middlePageIndex], 
						direction:"left", 
						callback: function () {
							
							storybook.dispatchEvent("nextPageEnd", navigating.targetPageIndex);
						
							// Update the current page
							curPageIndex = navigating.targetPageIndex;
							navigating = null;
						}
					});
				}
			});
			
			updatePageVisibility();
		}
	},
	
	storybook.prevPage = function () {
		
		if (book.getCurrentPageIndex() > 1) {
		
			book.previousPage();
			return true;
		}
		
		return false;
	};
	
	storybook.nextPage = function () {

		if (book.getCurrentPageIndex() < book.getNumPages() - 3) {
			
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
	
	storybook.startHighlighting = function (pageIndex) {

		return pages[pageIndex !== undefined ? pageIndex : curPageIndex].startHighlighting();
	};
	
	storybook.stopHighlighting = function (pageIndex) {

		return pages[pageIndex !== undefined ? pageIndex : curPageIndex].stopHighlighting();
	};
	
	storybook.getChildren = function (pageIndex) {

		return pages[pageIndex !== undefined ? pageIndex : curPageIndex].getChildren();
	};
	
	storybook.getChild = function (name, pageIndex) {

		return pages[pageIndex !== undefined ? pageIndex : curPageIndex].getChild(name);
	};
	
	Object.defineProperty(storybook, "numberOfPages", {
		get: function () {
			return pages.length;
		}
	});
	
	Object.defineProperty(storybook, "targetPageIndex", {
		get: function () {
			return navigating && navigating.targetPageIndex;
		}
	});
	
	Object.defineProperty(storybook, "curPageIndex", {
		get: function () {
			return curPageIndex;
		}
	});
	
	//Object.defineProperty(storybook, "parentElement", {
	//	get: function () {
	//		return parentElement;
	//	}
	//});
	
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
		
		var i,
			y = 0;

		// Add each page of the storybook
		for (i = 0; i < storybookSpec.pages.length; i += 1) {
			pages[i] = BLOCKS.storybookPage(storybookSpec.pages[i]);
			
			if (debugShowAllPages) {
				pages[i].y -= 10 * Math.ceil(storybookSpec.pages.length / 2);
				pages[i].y += y;
				pages[i].alpha = 0.8;
			}
			
			// If odd
			if (i % 2 === 0 || i === 0) {
				pages[i].turnRatio = -1;
			} else {
				if (debugShowAllPages) {
					y += 10;
				}
			}
		}
		curPageIndex = 1;
		
		// Hide pages not visible
		updatePageVisibility();
	}());
	
	return storybook;
};
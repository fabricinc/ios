var TouchMove = {
		target: null,
		topThreshold: 30, // percentage of height
		bottomThreshold: 20,
		rowHeight: null,
		scroller: null, // Will need to refactor if this is required somewhere else.
		scrolling: false,
		scrollTime: 200,
		initialScrollPos: null,
		scrollOffset: 0,

		init: function() {
		    var top = this.topThreshold,
		        bot = this.bottomThreshold,
		        height = $(window).outerHeight();

		    //this.scroller = APP.MovieListController.scroller;

		    this.rowHeight = $(".list-row").height();

		    this.topThreshold = height * (top / 100);
		    this.bottomThreshold = height - (height * (bot / 100));
		},
		enableTouchMove: function(custom) {
		    this.init();
		    var self = this,
		        items = ".list-row";

		    if (custom) items += ".custom";

		    /*$("#list-row").sortable({
		        "handle": ".list-row-move",
		        "items": items,
		        "opacity": .7,
		        "update": function() {
		            UI.updateAllNumbers();
		            var sortOrder = $(this).sortable("serialize");
		            if ($(".lists").length > 0) {
		                Api.setListsListSortOrder(sortOrder);
		            } else {
		                Api.setListSortOrder(APP.models.movielist.listID, sortOrder);
		            }
		        },
		        scroll: false
		    });*/

			$("#list-movies").sortable({
				scrollSensitivity: 20,
				//tolerance: "pointer",
				handle: ".drag-icon",
				items: ".list-row",
				//grid: [ 20, 1 ],
				scrollSpeed: 30,
				scroll: false,
				distance: 0,
				opacity: .5,
				axis: "y",
				start: function(event, ui){
					UI.deallocScroller();
					var scrollObj = $("#list-movies"),
						y = scrollObj.position().top;

					/*$(document).mousemove(function(event){
						mouseY = event.pageY;

						if(mouseY < 90) {
							for(y; y < 0; y++) {
								self.updateScroll(y);
							}
						}
						
					});*/

				},
				stop: function(event, ui){
					UI.initScrollerOpts($("#list-row-wrapper")[0], {
		                vScrollbar: false,
		                hScroll: false,
		                bounce: true,
		                startY: $("#list-movies").position().top
		            });
				},
				change: function(event, ui){
					var scrollObj = $("#list-movies"),
						y = scrollObj.position().top;

					if(y < 0){
						scrollObj.css({	
							"-webkit-transform": "translate(0px," + (y + 120) + "px) translateZ(0px)",
							"-webkit-transition-duration": "600ms"
						});
					}

				},
				sort: function(event, ui){
/*					var scrollObj = $("#list-movies"),
						y = scrollObj.position().top;

					$(document).mousemove(function(event){
						mouseY = event.pageY;

						if(mouseY < 90) {
							scrollObj.css({	
								"-webkit-transform": "translate(0px," + (y + 20) + "px) translateZ(0px)",
								"-webkit-transition-duration": "400ms"
							});
						}
					});*/
				},
				update: function(event, ui){
					UI.updateAllNumbers();
					var sortOrder = $(this).sortable("serialize"),
						listID = $("#list-movies").data("listid");
					Api.setListSortOrder(listID, sortOrder);

				}
			});

            /*$("#listdiv ul").sortable({ opacity: 0.6, cursor: 'move', update: function() {
                    var order = $(this).sortable("serialize") + '&action=update';
                }
            });*/

			//enable touch events for sort
		    /*if (Modernizr.touch) {
		        document.addEventListener("touchstart", Util.touchHandler, true);
		        document.addEventListener("touchmove", Util.touchHandler, true);
		        document.addEventListener("touchend", Util.touchHandler, true);
		        document.addEventListener("touchcancel", Util.touchHandler, true);

		    }*/
		},

		updateScroll: function(y) {
			var scrollObj = $("#list-movies");
			
			setInterval(function(){
				scrollObj.css({	
					"-webkit-transform": "translate(0px," + (y) + "px) translateZ(0px)"
					// "-webkit-transition-duration": "400ms"
				});
			}, 100);

		},
		disableTouchMove: function() {
		    this.target = null;
		    this.initialScrollPos = null;
		    $("#list-row").sortable("destroy");

		    if (Modernizr.touch) {
		        document.removeEventListener("touchstart", Util.touchHandler, true);
		        document.removeEventListener("touchmove", Util.touchHandler, true);
		        document.removeEventListener("touchend", Util.touchHandler, true);
		        document.removeEventListener("touchcancel", Util.touchHandler, true);
		    }
		},

		doTouchScroll: function(y) {
		    if (this.scrolling === true) return false;

		    var self = this,
		        yScrollTo = self.rowHeight;

		    if (y <= self.topThreshold && !(-self.scroller.getScrollY() < self.rowHeight)) {
		        yScrollTo = -yScrollTo;
		        self.scroll(yScrollTo);
		        self.lockTarget(y);

		    } else if (y >= this.bottomThreshold) {
		        self.scroll(yScrollTo);
		//            self.lockTarget();

		    }

		},

		lockTarget: function() {
		    this.target.style.webkitTransform = "translateY(" + this.scrollOffset + ")";
		},

		scroll: function(y) {
		    this.scrolling = true;

		    var self = this;

		    self.scroller.scrollTo(0, y, this.scrollTime, true);

		    self.scrollOffset = -(Util.getTranslateY("list-row")*1) + self.initialScrollPos;
		    self.lockTarget();
		    Util.log("offset", self.scrollOffset);

		    setTimeout(function() {
		        self.scrolling = false;
		    }, this.scrollTime);
		}
	}
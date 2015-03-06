SwipeViewController = {
    gallery: null,
    initialize: function(ele, slides, width, height) {
        var	gallery,
            el,
            i,
            page,
            slide,
            dots = document.querySelectorAll('#nav li');

        if (!slides) slides = [];

        // find only slides with .box > 100, all others should not be visible
        var visibleSlides = [];
        for(var i=0; i < slides.length; i++) {
            if(slides[i].box > 100) {
                visibleSlides.push(slides[i]);
            }
        }
        // set slides to be only visible slides
        slides = visibleSlides;

        // initialize gallery with slide length
        this.gallery = new SwipeView(ele, { numberOfPages: slides.length, hastyPageFlip: true });

        // Load initial data for first 3 slides
        for (i=0; i<3; i++) {
            page = i==0 ? slides.length-1 : i-1;
            slide = slides[page];

            el = document.createElement('img');
            el.className = 'loading';
            el.src = slide.image;
            el.width = width;
            el.height = height;

            // set element data
            $(el).data("options", {
                categoryID: slide.rel,
                movieID: slide.movie_id,
                title: slide.label,
                contestID: slide.contestID
            });

            // attach the click event with anonymous js function
            var func = (function(element, s) {
                // If contestID != null, attach the contest link
                if(s.contestID) {
                    $(element).click(function(e) { // WARNING: do NOT use fastClick in this instance - because it is also a Slide element.
                        e.preventDefault();
                        e.stopPropagation();

                        Backbone.history.navigate("contest/" + s.contestID, true);
                        return false;
                    });
                } else { // else we set normal link target for category
                    $(element).click(function(e) { // WARNING: do NOT use fastClick in this instance - because it is also a Slide element.
                        e.preventDefault();
                        e.stopPropagation();

                        Backbone.history.navigate("categories?categoryID=" + s.id + "&movieID=" + s.movie_id, true);
                        //Backbone.history.navigate("categories/" + s.id, true);
                        return false;
                    });
                }
                return true;
            })(el, slide);

            el.onload = function () { this.className = ''; }
            this.gallery.masterPages[i].appendChild(el);

            el = document.createElement('span');
            el.innerHTML = slides[page].label;
            this.gallery.masterPages[i].appendChild(el)
        }

        this.gallery.onFlip(function () {
            var el,
                upcoming,
                i,
                gallery = SwipeViewController.gallery;

            if (!gallery) return;

            for (i=0; i<3; i++) {

                upcoming = gallery.masterPages[i].dataset.upcomingPageIndex;

                if (upcoming != gallery.masterPages[i].dataset.pageIndex) {
                    el = gallery.masterPages[i].querySelector('img');
                    el.className = 'loading';
                    slide = slides[upcoming];
                    el.src = slide.image;
                    el.width = width;
                    el.height = height;
                    $(el).data("options", {
                        categoryID: slide.rel,
                        movieID: slide.movie_id,
                        title: slide.label,
                        contestID: slide.contestID
                    });

                    // attach the click event with anonymous js function
                    var func = (function(e, s) {
                        $(e).unbind();
                        // if contestID != null, attach contest event click
                        if(s.contestID) {
                            $(e).click(function(e) { // WARNING: do NOT use fastClick in this instance - because it is also a Slide element.
                                e.preventDefault();
                                e.stopPropagation();

                                Backbone.history.navigate("contest/" + s.contestID, true);
                                return false;
                            });
                        } else { // else do normal category link click
                            $(e).click(function(e) { // WARNING: do NOT use fastClick in this instance - because it is also a Slide element.
                                e.preventDefault();
                                e.stopPropagation();

                                Backbone.history.navigate("categories/" + s.id, true);
                                return false;
                            });
                        }
                        return true;
                    })(el, slide);

                    gallery.masterPages[i].appendChild(el);

                    el = gallery.masterPages[i].querySelector('span');
                    el.innerHTML = slides[upcoming].label;
                }
            }

//            document.querySelector('#nav .selected').className = '';
//            dots[gallery.pageIndex+1].className = 'selected';
        });

        this.gallery.onMoveOut(function () {
            var gallery = SwipeViewController.gallery;
            gallery.masterPages[gallery.currentMasterPage].className = gallery.masterPages[gallery.currentMasterPage].className.replace(/(^|\s)swipeview-active(\s|$)/, '');
        });

        this.gallery.onMoveIn(function () {
            var gallery = SwipeViewController.gallery;
            var className = gallery.masterPages[gallery.currentMasterPage].className;
            /(^|\s)swipeview-active(\s|$)/.test(className) || (gallery.masterPages[gallery.currentMasterPage].className = !className ? 'swipeview-active' : className + ' swipeview-active');
        });

        this.gallery.play();
    }
}
var project = {};

project.doc = $(document);
project.win = $(window);
project.body = $('body');
project.wrap = $('.wrap');
project.page = $('main.page');

project.isTablet = (function() {
	return $(".responsive .tablet").css('display') === 'block' ? true : false;
});
project.isMobile = (function() {
	return $(".responsive .mobile").css('display') === 'block' ? true : false;
});

project.vh = (function() {
	return project.win.height();
});

project.debounce = (function(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
});

// fill up data
// data.forEach(function(item) {
// 	// create new item
// 	jQuery('.acf-button.button.button-primary').click();
// 	// select the newly created row
// 	var line = jQuery('.acf-row:not(.acf-clone)').last();
// 	// go through each field
// 	Object.keys(item).forEach(function(key) {
// 		// add the value
// 		line.find("[data-name='"+key+"'] .acf-input input").val(item[key]);
// 	});
// });
project.nutrition = {};

project.tablet = (function() {
	return $(".responsive .tablet").css('display') === 'block' ? true : false;
});
project.mobile = (function() {
	return $(".responsive .mobile").css('display') === 'block' ? true : false;
});

project.nutrition.pm = (function() {
	if (project.tablet()) {
		parent.postMessage(project.wrap.height(), "*");
	} else {
		parent.postMessage(1000, "*");
	}
});

project.nutrition.calculator = (function() {

	var calc = $('section.calculator'),
		labels = calc.find('.category .labels'),
		catnames = labels.find('.val'),
		actual = $('.calculator.actual'),

		screens = project.page.find('.screens .screen'),

		totals = $('.calculator.totals'),
		// thetotal = totals.find('.item.total'),
		totalmore = totals.find('.more'),
		totalvals = totals.find('.total .val'),

		breakert = project.page.find('.breaker.top'),
		breakerb = project.page.find('.breaker.bottom'),

		items = calc.find('.category .item').not('.labels, .total, .label, .option'),
		itemsmore = items.find('.more'),

		filter = calc.find('.filter'),
		fbar = filter.find('.top'),
		flines = filter.find('.container .line'),
		fclear = filter.find('.clear'),

		cnmax = 0,
		results = [],
		tempresults,
		scrollAmount,
		totalsHeight, actualsHeight, actualsOffset,
		vh, pointt, pointb,

		overflow = $('.nutriflow'),
		overtable = overflow.find('.table'),
		pop = overflow.find('.content'),
		closeIcon = pop.find('.close'),
		lastScroll,
		
		cname = pop.find('.header p'),
		clines = pop.find('.line')
		;

	function setVars() {
		totalsHeight = totals.outerHeight();
		actualsHeight = actual.outerHeight();
		actualsOffset = actual.offset().top;
		vh = project.vh();
	}

	// leave enough space for vertical column names
	function setLabelsHeight() {
		catnames.each(function() {
			var that = $(this).children(),
				w = that.outerWidth();
			if (w > cnmax) {
				cnmax = w;
			}
		});

		if (!project.isTablet()) {
			catnames.css('height',cnmax);
			labels.css('height', cnmax);
		} else {
			catnames.css('height', 'auto');
			labels.css('height', 'auto');
		}

		setVars();

		project.page.css('padding-bottom', totalsHeight);
	}

	// check if totals should be fixed to bottom of page
	function fixedTotals() {
		setLabelsHeight();

		scrollAmount = project.win.scrollTop();

		// find the active ones
		breakert = project.page.find('.screen.show .breaker.top');
		breakerb = project.page.find('.screen.show .breaker.bottom');

		// set totals offset
		totals.css('bottom', -totalsHeight);

		pointt = breakert.offset().top - vh + totalsHeight*1.5;
		pointb = breakerb.offset().top - vh + totalsHeight;

		if (scrollAmount <= pointt) {
			// remove if at the top of page
			totals.removeClass('stick');
		} else if (scrollAmount > pointt && scrollAmount < pointb) {
			// make fixed
			totals.addClass('stick').removeClass('stay');
			project.page.css('padding-bottom', totalsHeight);
		} else if (scrollAmount >= pointb) {
			// make relative when at the bottom
			totals.addClass('stay');
			project.page.css('padding-bottom', 0);
		}

		// console.log(scrollAmount, breakerb.offset().top, vh, totalsHeight, pointb);
	}

	// calculate new total values
	function updateTotal(type, vals) {
		var label = project.page.find('.screens .screen.show').data('label');
		if (type === 'add') {
			results[label] = results[label].map(function (num, idx) {
				return num + parseFloat(vals[idx]);
			});
		} else if (type === 'sub') {
			results[label] = results[label].map(function (num, idx) {
				return num - parseFloat(vals[idx]);
			});
		}

		tempresults = [];

		project.page.find('.totals .total[data-label="'+label+'"] .val').each(function(index) {
			var that = $(this).children();

			that.html(results[label][index].toFixed(1));

			tempresults.push(results[label][index].toFixed(1));
		});

		// thetotal.attr('data-values', tempresults);
		project.page.find('.totals .total[data-label="'+label+'"]').attr('data-values', tempresults);
	}

	// save values as data in the DOM, run once
	function setupReults() {
		screens.each(function() {
			var screen = $(this),
				type = screen.data('label'),
				total = project.page.find('.totals .total[data-label="'+type+'"]'),
				totalvals = total.find('.val').length;

			tempresults = [];
			screen.find('.category .item').not('.labels, .total, .label, .option').each(function() {
				var item = $(this),
					vals = item.find('.val');

				tempresults = [];

				vals.each(function() {
					var that = $(this).children().html(),
						val = parseFloat(that);
					
					tempresults.push(isNaN(val) ? 0 : val);
				});

				item.attr('data-values', tempresults);
			});

			tempresults = Array.apply(null, Array(totalvals)).map(function() { return 0; });
			// thetotal.attr('data-values', tempresults);
			total.attr('data-values', tempresults);

			// create results array with correct size
			results[type] = Array.apply(null, Array(totalvals)).map(function() { return 0; });
		});	}

	function doFilter(type, set) {
		items.filter(function(index, elem) {
			var that = $(elem),
				count = that.data('filter-count') || 0;

			if (that.attr('data-filters').indexOf(type) < 0) {
				// subtract from total if this item was previously selected
				if (that.hasClass('selected')) that.click();

				// filter out
				if (set) {
					if (count < 1) that.addClass('filtered');
					count++;
					that.data('filter-count',count);
				} else {
					count--;
					that.data('filter-count',count);
					if (count === 0) that.removeClass('filtered');
				}
				return true;

			} else {
				return false;
			}
		});
	}

	function setInsideWidth() {
		overtable.css('width',overflow.width());
	}

	// fill content on mobile popup
	function fillContent(name, values) {
		// console.log(values);
		cname.html(name);

		values = values.split(',');

		clines.each(function(index) {
			var that = $(this);
			that.find('.val p').html(values[index]);
		});
	}

	function calculateTopPos(distance) {
		var popHeight = pop.height();
		// console.log(distance+popHeight,project.page.height());
		if (distance+(popHeight/2) < project.page.height()) {
			// console.log('half big');
			return distance-(popHeight/2);
		} else {
			// console.log('other big');
			return distance-popHeight;
		}
	}

	// open mobile popup
	function open(distance) {
		if (!overflow.hasClass('open')) {
			overflow.addClass('open visible');
			pop.addClass('show');

			// lastScroll = project.win.scrollTop();
			overtable.css('padding-top',calculateTopPos(distance));

			// project.wrap.addClass('mobiled').css('top',-lastScroll);
			project.body.addClass('mobiled').css('max-height',project.vh());

			setInsideWidth();
		}
	}

	// close mobile popup
	function close() {
		if (overflow.hasClass('open')) {
			overflow.removeClass('open');
			// project.wrap.removeClass('mobiled');
			setTimeout(function() {
				overflow.removeClass('visible');
				pop.removeClass('show');
				// project.wrap.attr('style','');
				project.body.removeClass('mobiled').css('max-height','initial');
				// project.win.scrollTop(lastScroll);
			},500);
		}
	}

	// click on food item
	items.on('click', function() {
		var that = $(this),
			vals = that.attr('data-values').split(',');

		if (!that.hasClass('filtered')) {
			if (!that.hasClass('selected')) {
				that.addClass('selected');
				updateTotal('add', vals);
			} else {
				that.removeClass('selected');
				updateTotal('sub', vals);
			}
		}
	});

	// MOBILE

	// click on mobile info
	itemsmore.on('click', function(event) {
		event.stopPropagation();
		if (!overflow.hasClass('open')) {
			var that = $(this);
			open(that.offset().top);
			fillContent( that.siblings('.name').find('p').html() , that.parent().attr('data-values') );

		} else {
			close();
		}
	});

	// click mobile totals info
	totalmore.on('click', function() {
		if (!overflow.hasClass('open')) {
			var that = $(this);
			open(that.offset().top);
			fillContent(that.siblings('.name').find('p').html(), that.parent().attr('data-values') );

		} else {
			close();
		}
	});

	// click on mobile popup close
	closeIcon.on('click', function() {
		close();
	});

	// stop propagation
	overflow.on('click', '.content', function(event) {
		event.stopPropagation();
	});

	// click outside to close popup
	overflow.on('click', function() {
		if (overflow.hasClass('open')) {
			close();
		}
	});

	// FILTER

	// click outside to close filter
	project.page.on('click', function() {
		if (filter.hasClass('open')) {
			filter.removeClass('open');
		}
	});

	// click to open filter
	fbar.on('click', function(event) {
		event.stopPropagation();

		if (!filter.hasClass('open')) {
			filter.addClass('open');
		} else {
			filter.removeClass('open');
		}
	});

	// click on filter item
	flines.on('click', function(event) {
		var that = $(this),
			type = that.data('filter');

		event.stopPropagation();

		if (!that.hasClass('active')) {
			that.addClass('active');
			doFilter(type, true);
		} else {
			that.removeClass('active');
			doFilter(type, false);
		}
	});

	// clear filters
	fclear.on('click', function() {
		flines.each(function() {
			var that = $(this);
			if (that.hasClass('active')) {
				that.click();
			}
		});
	});


	//setTimeout(function() {
		setLabelsHeight();
	//},250);
	setupReults();

	project.win.resize(function() {
		setLabelsHeight();
		setInsideWidth();

		if (!project.isTablet()) close();
	});

	project.win.scroll(function() {
		fixedTotals();
	});

});

project.nutrition.screens = (function() {
	var selector = project.page.find('.selector'),
		selectors = selector.find('.select'),
		screens = project.page.find('.screens .screen'),
		totals = project.page.find('.totals .total');

	selector.on('click', '.select', function() {
		selectors.addClass('hide');
		$(this).removeClass('hide');

		screens.removeClass('show');
		project.page.find('.screens .screen[data-label="'+$(this).data('label')+'"]').addClass('show');

		totals.removeClass('show');
		project.page.find('.totals .total[data-label="'+$(this).data('label')+'"]').addClass('show');

		project.nutrition.pm();
	});
});

if (project.page.hasClass('nutrition')) {
	project.nutrition.calculator();
	project.nutrition.screens();

	project.win.on('load', function() {
		project.nutrition.pm();
	});

	project.win.resize(function() {
		project.nutrition.pm();
	});
}

$(".name").click(function() { 
	$(this).find("i").toggleClass("fa-plus fa-check");
  });



//   $(".select").click(function() { 
	
// 	$(function(){
    
// 		var iFrames = $('iframe');
	  
// 		function iResize() {
		
// 			for (var i = 0, j = iFrames.length; i < j; i++) {
// 			  iFrames[i].style.height = iFrames[i].contentWindow.document.body.offsetHeight + 'px';}
// 			}
			
// 			if ($.browser.safari || $.browser.opera) { 
			
// 			   iFrames.load(function(){
// 				   setTimeout(iResize, 0);
// 			   });
			
// 			   for (var i = 0, j = iFrames.length; i < j; i++) {
// 					var iSource = iFrames[i].src;
// 					iFrames[i].src = '';
// 					iFrames[i].src = iSource;
// 			   }
			   
// 			} else {
// 			   iFrames.load(function() { 
// 				   this.style.height = this.contentWindow.document.body.offsetHeight + 'px';
// 			   });
// 			}
		
// 		});


//   });
  
  

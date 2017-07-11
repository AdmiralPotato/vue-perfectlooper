"use strict";
//reference & source: https://github.com/AdmiralPotato/vue-swipe-cards/blob/master/vue-swipe-cards.js

let touchHandlingMixin = {
	created: function(){
		let t = this;
		//internal properties that should not be observables,
		//and need not be redefined each time the render method is run
		t.startPoint = null;
		t.handleTouchStart = t.createTouchHandler('Start');
		t.handleTouchMove = t.createTouchHandler('Move');
		t.handleTouchEnd = t.createTouchHandler('End');
	},
	methods: {
		getPointByTouch: function(touchEvent){
			let t = this;
			let touches = touchEvent.changedTouches;
			let result = null;
			let point = null;
			let isStart = t.startPoint === null;
			if (isStart) {
				result = touches[0];
			} else {
				for (let i = 0; i < touches.length; i++) {
					let touch = touches[i];
					if (touch.identifier === t.startPoint.id) {
						result = touch;
						break;
					}
				}
			}
			if (result) {
				let bounds = event.currentTarget.getBoundingClientRect();
				point = {
					x: result.clientX - bounds.left,
					y: result.clientY - bounds.top,
					id: result.identifier
				};
				if(isStart){
					t.startPoint = point;
				}
			}
			return point;
		},
		createTouchHandler(eventName){
			let t = this;
			return function(touchEvent){
				//console.log(touchEvent);
				let point = t.getPointByTouch(touchEvent);
				if (point) {
					t[`drag${eventName}`](point, touchEvent);
					if(eventName === 'End'){
						t.startPoint = null;
					}
				}
			};
		},
	}
};

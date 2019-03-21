import DecoderImage from './decoder-image.js';

let CanvasLooper = function (id, pathList, ui, canvas) {
	let p = this;
	p.ui = ui;
	p.canvas = canvas;
	p.context = canvas.getContext('2d');
	p.shouldPlay = false;
	p.scaledCanvasList = [];
	p.lastDisplayedImage = null;
	p.lastDisplayedIndex = 0;
	p.scaledFrameCount = 0;
	p.scaled = 0;
	p.ready = false;
	p.playOffset = 0;
	p.prevFrame = 0;
	p.sourceBuffer = decodedFrameBufferMap[id] || new DecodedFrameBuffer(id, pathList);
	p.frameCount = pathList.length;
	p.duration = p.frameCount / p.fps;
	p.sourceBuffer.addCanvasLooper(p);
	p.renderLoop = (time) => {
		if(p.shouldPlay){
			requestAnimationFrame(p.renderLoop);
			if(p.ready){
				p.play(time);
			}
		}
	};
};

CanvasLooper.prototype = {
	fps: 24,
	die () {
		let p = this;
		p.sourceBuffer.removeCanvasLooper(this);
		p.scaledCanvasList.forEach((canvas) => {
			canvas.width = 0;
			canvas.height = 0;
		});
		p.scaledCanvasList = [];
		p.shouldPlay = false;
		p.ui.looperEvent({
			eventAction: 'unload'
		});
	},
	setPlay (shouldPlay) {
		let p = this;
		p.shouldPlay = shouldPlay;
		if(shouldPlay){
			requestAnimationFrame((time) => {
				p.lastTimeSample = time;
				p.renderLoop(time);
			});
			p.sourceBuffer.startLoad();
		} else {
			p.sourceBuffer.stopLoad();
		}
		p.updateUI();
	},
	play (time) {
		let p = this;
		p.offsetTime(((time - (p.lastTimeSample || 0)) / 1000) / p.duration);
		p.setFrameByTime();
		p.lastTimeSample = time;
	},
	offsetTime (delta) {
		this.setTime(this.playOffset + delta);
	},
	setTime (playOffset) {
		this.playOffset = this.rangeBind(playOffset, 1);
	},
	rangeBind (value, max) {
		return Math.sign(value) === -1 ? max + (value % max) : value % max;
	},
	step (direction) {
		let p = this;
		let targetFrame = p.rangeBind(p.prevFrame + direction,  p.frameCount);
		p.offsetTime((1 / p.frameCount) * direction);
		p.setFrameByIndex(targetFrame);
	},
	setFrameByTime () {
		let p = this;
		let targetFrame = Math.floor(p.playOffset * p.frameCount);
		if(targetFrame !== p.prevFrame){
			p.setFrameByIndex(targetFrame);
		}
	},
	setFrameByIndex (frameIndex) {
		let p = this;
		p.lastDisplayedImage = p.getScaledCanvasByFrameIndex(frameIndex);
		p.context.drawImage(p.lastDisplayedImage, 0, 0);
		p.prevFrame = frameIndex;
		p.ui.looperStatusUpdate({
			currentFrameIndex: frameIndex,
			playOffset: frameIndex / (p.frameCount - 1)
		});
	},
	getScaledCanvasByFrameIndex (frameIndex) {
		let p = this;
		let list = p.scaledCanvasList;
		let canvas = list[frameIndex] || document.createElement('canvas');
		let needUpdate = (
			!list[frameIndex] ||
			canvas.width !== p.width ||
			canvas.height !== p.height
		);
		if(needUpdate){
			let imageSource = p.sourceBuffer.imageList[frameIndex];
			let context = canvas.getContext('2d');
			canvas.width = p.width;
			canvas.height = p.height;
			context.imageSmoothingQuality = "high";
			context.drawImage(imageSource, 0, 0, p.width, p.height);

			if(!list[frameIndex]){
				list[frameIndex] = canvas;
			}
		}
		return canvas;
	},
	sizeWindow (newWidth, newHeight) {
		let p = this;
		p.width = newWidth;
		p.height = newHeight;
		p.scaledFrameCount = 0;
		p.scaled = 0;
		p.ready = false;
		p.updateUI();
	},
	scaleAllFramesAndReady () {
		let p = this;
		let frame = p.scaledFrameCount++;
		if(!frame){
			p.ui.looperEvent({
				eventAction: 'scale-start',
				eventValue: p.width
			});
		}
		p.context.drawImage(p.getScaledCanvasByFrameIndex(frame), 0, 0);
		p.scaled = p.scaledFrameCount / p.frameCount;
		setTimeout(() => {
			let looperEventData;
			if(p.scaledFrameCount === p.frameCount){
				p.ready = true;
				looperEventData = {
					eventAction: 'scale-finish',
					eventValue: p.width
				};
			}
			p.updateUI(looperEventData);
		}, 0);
	},
	updateUI (looperEventData) {
		let p = this;
		let b = p.sourceBuffer;
		let status = b.status;
		let displayFrame = p.whichFrameShouldBeDisplayedOnUpdate();
		if(b.ready && !p.ready){
			if(p.scaledFrameCount){
				status = `Scaled ${p.scaledFrameCount}/${b.frameCount} frames`;
			}
			if(p.shouldPlay){
				p.scaleAllFramesAndReady();
			}
		}
		if(p.ready){
			status = 'Ready';
		}
		if(displayFrame !== null){
			p.lastDisplayedImage = p.getScaledCanvasByFrameIndex(displayFrame);
		}
		if(p.lastDisplayedImage){
			p.context.drawImage(p.lastDisplayedImage, 0, 0);
		}
		if(looperEventData){
			p.ui.looperEvent(looperEventData);
		}
		p.ui.looperStatusUpdate({
			statusMessage: status,
			loaded: b.loaded,
			scaled: p.scaled,
			ready: p.ready
		});
	},
	whichFrameShouldBeDisplayedOnUpdate () {
		let p = this;
		let b = p.sourceBuffer;
		let displayFrame = b.lastStoredFrameIndex;
		if(b.ready) {
			if (!p.shouldPlay || p.ready) {
				displayFrame = p.prevFrame;
			} else {
				displayFrame = Math.max(0, p.scaledFrameCount - 1);
			}
		}
		return displayFrame;
	}
};

let arrayRemove = (array, item) => {
	let index = array.indexOf(item);
	if(index !== -1){
		array.splice(index, 1);
	}
	return array;
};

let decodedFrameBufferMap = {};

let DecodedFrameBuffer = function (id, pathList) {
	let b = this;
	b.pathList = pathList;
	b.frameCount = pathList.length;
	b.isLoading = false;
	b.totalSize = 0;
	b.loaded = 0;
	b.ready = false;
	b.status = 'Not loaded';
	b.imageList = [];
	b.perfectlooperList = [];
	b.framesLoaded = 0;
	b.lastStoredFrameIndex = null;
	b.decoder = new DecoderImage(b);
	decodedFrameBufferMap[id] = b;
};

DecodedFrameBuffer.prototype = {
	addCanvasLooper (p) {
		this.perfectlooperList.push(p);
		this.updateCanvasLoopers();
	},
	removeCanvasLooper (p) {
		arrayRemove(this.perfectlooperList, p);
	},
	updateCanvasLoopers (looperEventData) {
		let b = this;
		b.perfectlooperList.forEach((p) => {
			p.updateUI(looperEventData);
		});
	},
	startLoad () {
		let b = this;
		if(!b.isLoading && b.loaded !== 1){
			b.status = 'Loading';
			b.isLoading = true;
			b.decoder.startLoad(b.pathList);
			let looperEventData = {
				eventAction: 'load-start',
				eventValue: b.framesLoaded
			};
			this.updateCanvasLoopers(looperEventData);
		}
	},
	stopLoad () {
		let b = this;
		if(b.loaded !== 1){
			b.status = 'Loading paused';
			b.isLoading = false;
			b.decoder.stopLoad();
			let looperEventData = {
				eventAction: 'load-stop',
				eventValue: b.framesLoaded
			};
			this.updateCanvasLoopers(looperEventData);
		}
	},
	handleDecoderLoadStart () {
		this.status = 'Loading started';
		this.updateCanvasLoopers();
	},
	handleDecoderFrame (frameCanvas, index) {
		let b = this;
		let looperEventData;
		b.framesLoaded += 1;
		b.imageList[index] = frameCanvas;
		b.loaded = b.framesLoaded / b.frameCount;
		b.lastStoredFrameIndex = index;
		b.status = `Loaded ${b.framesLoaded} / ${b.frameCount} frames`;
		if(b.loaded === 1){
			b.status = `All frames Loaded`;
			b.ready = true;
			b.decoder = null;
			looperEventData = {
				eventAction: 'load-finish'
			};
		}
		this.updateCanvasLoopers(looperEventData);
	},
};

export default CanvasLooper;

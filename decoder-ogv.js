"use strict";

let DecoderOGV = function (decodedFrameBuffer) {
	let decoder = this;
	decoder.decodedFrameBuffer = decodedFrameBuffer;
	decoder.player = new OGVPlayer({
		sync: 'delay-audio',
		threaded: window['Worker'] !== undefined,
		enableWebM: true,
		memoryLimit: 1<<(25 + defaultQuality) //26 for 1920, 25 for 960
	});
	decoder.player.addEventListener('loadedmetadata', function () {
		decoder.hijackFrameOutput();
	});
};

DecoderOGV.prototype = {
	startLoad: function (url) {
		this.player.src = url;
		this.startDecodeTime = window.performance.now();
		this.player.play();
	},
	hijackFrameOutput: function () {
		let decoder = this;
		let frameSink = decoder.player.getVideoFrameSink();
		let originalDrawFrameFunc = frameSink.drawFrame;
		frameSink.drawFrame = function(data){
			originalDrawFrameFunc.call(frameSink, data);
			decoder.imageDecodeCallback();
		};
	},
	imageDecodeCallback: function(){
		let decoder = this;
		let sourceCanvas = decoder.player.getCanvas();
		let canvas = document.createElement('canvas');
		let context = canvas.getContext('2d');
		let width = sourceCanvas.width;
		let height = sourceCanvas.height;
		canvas.width = width;
		canvas.height = height;
		context.drawImage(sourceCanvas, 0, 0, width, height);
		decoder.decodedFrameBuffer.handleDecoderFrame(canvas);
		decoder.stopDecodeTime = '' + decoder.decodedFrameBuffer.canvasList.length + ':' + ((window.performance.now() - decoder.startDecodeTime) / 1000).toFixed(2);
	}
};

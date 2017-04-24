"use strict";

let DecoderHEVC = function (decodedFrameBuffer) {
	this.libdePlayer = new libde265.RawPlayer(document.createElement('canvas'));
	this.libdePlayer.addFrameBuffer(decodedFrameBuffer);
};

DecoderHEVC.prototype = {
	startLoad: function (url) {
		this.libdePlayer.startLoad(url);
	}
};

libde265.RawPlayer.prototype._display_image = function(libde265Image){
	let decoder = this;
	let decodedFrameBuffer = decoder.decodedFrameBuffer;
	let bufferCanvas = document.createElement('canvas');
	let bufferContext = bufferCanvas.getContext('2d');
	let w = libde265Image.get_width();
	let h = libde265Image.get_height();
	bufferCanvas.width = w;
	bufferCanvas.height = h;
	bufferContext.fillStyle = '#000';
	bufferContext.fillRect(0,0,w,h);
	decoder.image_data = bufferContext.createImageData(w, h);
	libde265Image.display(decoder.image_data, function(display_image_data) {
		bufferContext.putImageData(display_image_data, 0, 0);
		decodedFrameBuffer.handleDecoderFrame(bufferCanvas);
	});
};

libde265.RawPlayer.prototype.handlerMap = {
	loading: 'LoadStart',
	loadProgress: 'LoadProgress',
	initializing: 'DecodeStart'
};

libde265.RawPlayer.prototype.addFrameBuffer = function(decodedFrameBuffer){
	let decoder = this;
	decoder.decodedFrameBuffer = decodedFrameBuffer;
	decoder.set_status_callback(function(msg, extra) {
		let handler = decoder.handlerMap[msg];
		if (handler) {
			decodedFrameBuffer['handleDecoder' + handler](extra);
		}
	});
};

libde265.RawPlayer.prototype.startLoad = function(url) {
	let decoder = this;
	let request = new XMLHttpRequest();
	decoder._reset();
	request.open("get", url, true);
	request.responseType = "arraybuffer";
	request.onprogress = function(event) {
		decoder._set_status("loadProgress", event);
	};
	request.onload = function(event) {
		decoder._handle_onload(request, event);
	};
	decoder._set_status("loading");
	decoder.running = true;
	request.send();
};

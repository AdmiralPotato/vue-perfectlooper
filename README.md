# vue-perfectlooper

A perfectly looping image sequence player with fullscreen capabilities, built with mobile performance and keyboard accessibility in mind.

Demo: https://admiralpotato.github.io/vue-perfectlooper/

This project's primary objective is to allow seamless playback of short, perfectly looping animations in the browser, at the highest possible visual quality, optionally in fullscreen mode. Providing frames at the full resolution of your intended output device with no visible compression artifacts is strongly recommended.

#### Viewer friendly features:
- Very low CPU usage while playing
- Timeline scrubbing
- Frame advance & reverse
	- via buttons for mouse and touchscreen users
	- via keyboard left & right arrows when any element of the player has focus
- Fullscreen ability
	- there's even been effort put into making this sorta kinda work on iOS
		- iOS Safari interactivity DangerZone™ avoidance!

#### Developer friendly features:
- It's responsive; adapts to any element you put it in
- It's a one file module; even contains its own CSS
- Customizable frame path options

----

## Install and Usage

### Compiled `.vue` file flavor:
```
npm install --save vue-perfectlooper
```
`myLoop.vue`:
```vue
<template>
	<vue-perfectlooper v-bind="loop"></vue-perfectlooper>
</template>
<script>
	import VuePerfectlooper from 'vue-perfectlooper';
	let amazonCDN = 'https://aws-website-videonuclearpixelcom-tgl8t.s3.amazonaws.com/content/';
	export default {
		components: {VuePerfectlooper},
		data: function(){
			return {
				loop: {
					"id": "crusaderarts_red_room_tribute-24",
					"poster": amazonCDN + "crusaderarts_red_room_tribute-24-preview.jpg",
					"src": amazonCDN + "crusaderarts_red_room_tribute-24-1920x1080/",
					"frames": 24
				}
			}
		}
	};
</script>
```

### Vanilla Javascript

In your HTML:
```html
<div id="myLoopHolder">
	<vue-perfectlooper v-bind="loop"></vue-perfectlooper>
</div>
<script src="https://unpkg.com/vue"></script>
<script src="https://unpkg.com/vue-perfectlooper"></script>
<script>
	Vue.component('vue-perfectlooper', VuePerfectlooper);
	var amazonCDN = 'https://aws-website-videonuclearpixelcom-tgl8t.s3.amazonaws.com/content/';
	new Vue({
		el: '#myLoopHolder',
		data: {
			loop: {
				"id": "crusaderarts_red_room_tribute-24",
				"poster": amazonCDN + "crusaderarts_red_room_tribute-24-preview.jpg",
				"src": amazonCDN + "crusaderarts_red_room_tribute-24-1920x1080/",
				"frames": 24
			}
		}
	});
</script>
```

## Providing frames to the player
All configurations require the following parameters:
- `id`: this is the primary key by which the source images are cached in-memory to prevent unnecessary HTTP traffic in the case that the player is spawned and destroyed more than once in a session after initial load; also used as the analytics identifier in the scenario that the [vue-analytics](https://www.npmjs.com/package/vue-analytics) plugin has been installed.

- `poster`: a path to the preview image which is displayed before the user chooses to play the animation.

There are currently several different formats which may be used to provide frames to the player:

### With the default structured file name sequence
All properties specified here are **required** for this configuration.
```json
{
	"id": "electric_flower",
	"poster": "https://cdn.example.com/loops/electric_flower-preview.jpg",
	"src": "https://cdn.example.com/loops/electric_flower/",
	"frames": 48
}
```
In this example, the required file structure is:
```
http://cdn.example.com/loops/electric_flower-preview.jpg
http://cdn.example.com/loops/electric_flower/(0001.jpg ~ 0048.jpg)
```

### With a custom structured file name sequence
There are additional configuration parameters that can be specified for a structured file name sequence. Note the addition of the following properties: `sequenceTemplate`, `startIndex`, `prefix`, `suffix`
```json
{
	"id": "infernal_recursion",
	"poster": "https://cdn.example.com/loops/infernal_recursion.jpg",
	"src": "https://cdn.example.com/loops/",
	"frames": 24,
	"startIndex": 0,
	"sequenceTemplate": "00",
	"prefix": "infernal_recursion-",
	"suffix": ".png"
}
```
In this example, the required file structure is:
```
https://cdn.example.com/loops/infernal_recursion.jpg
https://cdn.example.com/loops/infernal_recursion-(00 ~ 23).png
```

### With non-sequential image addresses
In this example, there are no expectations of asset organization, as each frame path is completely specified explicitly; As a side effect of this, the number of frames does not need to be specified in this configuration.
```json
{
	"id": "ghost_wins_at_candy_corn-24",
	"poster": "https://i.imgur.com/GraKGsu.jpg",
	"src": [
		"https://i.imgur.com/GraKGsu.jpg",
		"https://i.imgur.com/Y1g1hiK.jpg",
		"https://i.imgur.com/rHfKoSK.jpg",
		"https://i.imgur.com/siZcgeZ.jpg",
		"https://i.imgur.com/kTrrtwn.jpg",
		"https://i.imgur.com/6Y045sP.jpg",
		"https://i.imgur.com/9Vhetui.jpg",
		"https://i.imgur.com/4a4rNI2.jpg",
		"https://i.imgur.com/uyi5teq.jpg",
		"https://i.imgur.com/4aWoBVB.jpg",
		"https://i.imgur.com/M4ukBi5.jpg",
		"https://i.imgur.com/14N83Cz.jpg",
		"https://i.imgur.com/PseVZFY.jpg",
		"https://i.imgur.com/SKx2Uws.jpg",
		"https://i.imgur.com/x9qyGow.jpg",
		"https://i.imgur.com/xFouIvs.jpg",
		"https://i.imgur.com/SaguQJe.jpg",
		"https://i.imgur.com/5ohSkY1.jpg",
		"https://i.imgur.com/y60nEjV.jpg",
		"https://i.imgur.com/INUdQD1.jpg",
		"https://i.imgur.com/iof2JHQ.jpg",
		"https://i.imgur.com/vRFn9tT.jpg",
		"https://i.imgur.com/gqB3Vnz.jpg",
		"https://i.imgur.com/11Wvp6T.jpg"
	]
}
```

### With an Imgur Album ID
In this example, the only two required attributes are `id` and `srcImgurAlbumId`. The `poster` attribute is not required, as the Imgur Album's `cover` image can be used. If the `poster` attribute is passed, it will be displayed before the AJAX request for the album's frame list returns.

It is recommended when hosting image sequences at Imgur, that you upload only PNG sequences; Imgur will both host the original PNGs, as well as automatically generate JPGs at multiple resolutions that may be used for quality presets in a future version of the player. By default, the player uses Imgur's highest quality generated JPGs for playback, which are almost completely without visible compression artifacts. Uploading PNGs also comes with the benefit that you can configure the player to load and play the original PNG sequence, in the case that Imgur's highest quality JPGs did not meet your quality requirements.

#### Imgur Album ID "gotchas"
- Choosing to use the Imgur Album ID method causes the player to fire an AJAX request to `https://imgur-api-readonly.glitch.me/` and wait for a response before it will become interactive - so there may be a 0.25sec ~ 5sec delay before the `cover` and frame paths load.
- It can be tricky to correctly upload PNG sequences **in their correct order** to an Imgur album, so you may need to rearrange your frames in the album after they are all uploaded. The frames are played back in the order they are listed in the Imgur album. Always test that your animation plays back correctly before viewing it in fullscreen or sharing it with others, to avoid optically triggered seizures.

#### Imgur Album ID minimal
```json
{
	"id": "hyper_mograph_networking-48",
	"srcImgurAlbumId": "HMstF"
}
```

#### Imgur Album ID with poster display before ajax load, and forced load of original PNGs
```json
{
	"id": "hyper_mograph_networking-48",
	"poster": "https://i.imgur.com/o4Jj2u3.jpg",
	"srcImgurAlbumId": "HMstF",
	"suffix": ".png"
}
```

## Other Options
You may configure the player with these additional options:
- `fps`: Sets the framerate of image sequence playback. Default is 24.
- `aspect`: Explicitly set the aspect ratio of the player, overriding and ignoring the aspect ratio of the poster image and animation images. This will also cause the player to display at the desired size even before the poster image has loaded. This value can be calculated as `height / width`. Default value is automatically calculated as soon as the poster image is loaded, at which point the player will be displayed.

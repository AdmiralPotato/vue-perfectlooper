<template>
	<button :title="label" :alt="label">
		<svg viewBox="2 2 44 44">
			<slot />
			<use xlink:href="#button-click-mask" />
		</svg>
	</button>
</template>

<script>
export default {
	props: {
		label: String
	}
};
</script>

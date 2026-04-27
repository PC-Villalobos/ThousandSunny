return {
	id = "03-fuego",
	eraId = "fuego",
	order = 3,
	title = "Fuego",
	goal = "Cross the ember field without letting the flame die.",
	mechanics = {
		primary = "timing_heat",
		hazards = { "ember_burst", "smoke_gap" },
		collectibles = { "ember_memory" },
		checkpoints = { "start", "hearth", "night" }
	},
	narrator = {
		"Fire is not owned. Fire is negotiated.",
		"Every continue is a choice, never a trap."
	},
	rewards = {
		freeSkin = "chispa_viva",
		memory = "El fuego se respeta antes de dominarlo"
	}
}

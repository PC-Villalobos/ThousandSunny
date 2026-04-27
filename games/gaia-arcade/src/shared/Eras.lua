local Eras = {}

Eras.Order = {
	"sabana",
	"piedra",
	"fuego",
	"rio",
	"aldea",
	"metal",
	"vela",
	"vapor",
	"electricidad",
	"orbita",
	"red",
	"biosfera",
	"gaia"
}

Eras.ById = {
	sabana = {
		id = "sabana",
		title = "Sabana",
		theme = "Instinto y movimiento",
		seedLevel = "01-sabana",
		freeSkin = "sendero_sabana",
		premiumSkin = "guardian_sabana",
		mechanics = { "run", "jump", "collect" }
	},
	piedra = {
		id = "piedra",
		title = "Piedra",
		theme = "Herramienta y peso",
		seedLevel = "02-piedra",
		freeSkin = "tallador_piedra",
		premiumSkin = "obsidiana_pulida",
		mechanics = { "push", "break", "checkpoint" }
	},
	fuego = {
		id = "fuego",
		title = "Fuego",
		theme = "Riesgo y energia",
		seedLevel = "03-fuego",
		freeSkin = "chispa_viva",
		premiumSkin = "llama_azul",
		mechanics = { "timing", "heat", "restart" }
	},
	rio = { id = "rio", title = "Rio", theme = "Flujo y ruta" },
	aldea = { id = "aldea", title = "Aldea", theme = "Cooperacion y memoria" },
	metal = { id = "metal", title = "Metal", theme = "Precision y oficio" },
	vela = { id = "vela", title = "Vela", theme = "Exploracion y viento" },
	vapor = { id = "vapor", title = "Vapor", theme = "Presion y maquina" },
	electricidad = { id = "electricidad", title = "Electricidad", theme = "Circuito y velocidad" },
	orbita = { id = "orbita", title = "Orbita", theme = "Perspectiva y gravedad" },
	red = { id = "red", title = "Red", theme = "Conexion y ruido" },
	biosfera = { id = "biosfera", title = "Biosfera", theme = "Equilibrio y coste" },
	gaia = { id = "gaia", title = "Gaia", theme = "Sintesis y retorno" }
}

Eras.SeedLevels = {
	{
		id = "01-sabana",
		eraId = "sabana",
		contentPath = { "ReplicatedStorage", "GaiaArcade", "Levels", "01-sabana", "Level" }
	},
	{
		id = "02-piedra",
		eraId = "piedra",
		contentPath = { "ReplicatedStorage", "GaiaArcade", "Levels", "02-piedra", "Level" }
	},
	{
		id = "03-fuego",
		eraId = "fuego",
		contentPath = { "ReplicatedStorage", "GaiaArcade", "Levels", "03-fuego", "Level" }
	}
}

function Eras.getEra(eraId)
	return Eras.ById[eraId]
end

function Eras.getSeedLevel(levelId)
	for _, level in ipairs(Eras.SeedLevels) do
		if level.id == levelId then
			return level
		end
	end

	return nil
end

function Eras.getFirstLevelId()
	return Eras.SeedLevels[1].id
end

return Eras

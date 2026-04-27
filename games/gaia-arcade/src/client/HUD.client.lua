local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local root = ReplicatedStorage:WaitForChild("GaiaArcade")
local remotes = root:WaitForChild("Remotes")

local requestSnapshot = remotes:WaitForChild("RequestSnapshot")
local spendLife = remotes:WaitForChild("SpendLife")
local restartRun = remotes:WaitForChild("RestartRun")

local gui = Instance.new("ScreenGui")
gui.Name = "GaiaArcadeHUD"
gui.ResetOnSpawn = false
gui.Parent = playerGui

local panel = Instance.new("Frame")
panel.Name = "Panel"
panel.AnchorPoint = Vector2.new(0, 0)
panel.Position = UDim2.fromOffset(16, 16)
panel.Size = UDim2.fromOffset(320, 178)
panel.BackgroundTransparency = 0.12
panel.BackgroundColor3 = Color3.fromRGB(18, 24, 30)
panel.BorderSizePixel = 0
panel.Parent = gui

local title = Instance.new("TextLabel")
title.Name = "Title"
title.Position = UDim2.fromOffset(14, 10)
title.Size = UDim2.fromOffset(292, 28)
title.BackgroundTransparency = 1
title.Font = Enum.Font.GothamBold
title.TextSize = 18
title.TextColor3 = Color3.fromRGB(245, 245, 238)
title.TextXAlignment = Enum.TextXAlignment.Left
title.Text = "Gaia Arcade"
title.Parent = panel

local status = Instance.new("TextLabel")
status.Name = "Status"
status.Position = UDim2.fromOffset(14, 42)
status.Size = UDim2.fromOffset(292, 54)
status.BackgroundTransparency = 1
status.Font = Enum.Font.Gotham
status.TextSize = 14
status.TextColor3 = Color3.fromRGB(210, 218, 224)
status.TextXAlignment = Enum.TextXAlignment.Left
status.TextYAlignment = Enum.TextYAlignment.Top
status.TextWrapped = true
status.Text = "Loading..."
status.Parent = panel

local options = Instance.new("Frame")
options.Name = "GameOverOptions"
options.Position = UDim2.fromOffset(14, 104)
options.Size = UDim2.fromOffset(292, 58)
options.BackgroundTransparency = 1
options.Visible = false
options.Parent = panel

local function optionButton(name, index, label)
	local button = Instance.new("TextButton")
	button.Name = name
	button.Size = UDim2.fromOffset(92, 48)
	button.Position = UDim2.fromOffset((index - 1) * 100, 0)
	button.BackgroundColor3 = Color3.fromRGB(41, 52, 65)
	button.BorderSizePixel = 0
	button.Font = Enum.Font.GothamBold
	button.TextSize = 12
	button.TextWrapped = true
	button.TextColor3 = Color3.fromRGB(245, 245, 238)
	button.Text = label
	button.Parent = options
	return button
end

local waitButton = optionButton("Wait", 1, "Wait regen")
local restartButton = optionButton("Restart", 2, "Start over")
local robuxButton = optionButton("RobuxContinue", 3, "Continue")

local currentSnapshot = nil

local function readSnapshot()
	local ok, snapshot = pcall(function()
		return requestSnapshot:InvokeServer()
	end)

	if ok then
		currentSnapshot = snapshot
	else
		warn("Gaia HUD snapshot failed", snapshot)
	end
end

local function render()
	if not currentSnapshot then
		status.Text = "Waiting for Gaia services..."
		return
	end

	local lives = currentSnapshot.lives
	local progress = currentSnapshot.progress
	local eraTitle = progress.currentEraTitle or "Unknown era"
	local canPlay = lives.canPlay

	status.Text = ("Era: %s\nLevel: %s\nLives: %d/%d"):format(
		eraTitle,
		progress.currentLevelId or "unknown",
		lives.lives or 0,
		lives.maxLives or 0
	)

	options.Visible = not canPlay
end

local function refresh()
	readSnapshot()
	render()
end

waitButton.Activated:Connect(function()
	refresh()
end)

restartButton.Activated:Connect(function()
	restartRun:FireServer()
	task.wait(0.2)
	refresh()
end)

robuxButton.Activated:Connect(function()
	if not currentSnapshot then
		return
	end

	local product = currentSnapshot.catalog.products.continueRun
	if not product or product.id == 0 then
		warn("Continue product id is not configured yet")
		return
	end

	MarketplaceService:PromptProductPurchase(player, product.id)
end)

-- Temporary keyboardless smoke hook: call from Studio command bar if needed.
_G.GaiaArcadeSpendLife = function(reason)
	local ok, snapshot = pcall(function()
		return spendLife:InvokeServer(reason or "studio_smoke")
	end)
	if ok then
		currentSnapshot = snapshot
		render()
	end
end

refresh()

task.spawn(function()
	while gui.Parent do
		task.wait(15)
		refresh()
	end
end)

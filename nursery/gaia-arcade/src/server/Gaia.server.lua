local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local serverFolder = script.Parent
local LivesService = require(serverFolder:WaitForChild("LivesService"))
local ProgressionService = require(serverFolder:WaitForChild("ProgressionService"))
local MonetizationService = require(serverFolder:WaitForChild("MonetizationService"))

local root = ReplicatedStorage:WaitForChild("GaiaArcade")
local remotes = root:FindFirstChild("Remotes") or Instance.new("Folder")
remotes.Name = "Remotes"
remotes.Parent = root

local function remoteFunction(name)
	local remote = remotes:FindFirstChild(name)
	if not remote then
		remote = Instance.new("RemoteFunction")
		remote.Name = name
		remote.Parent = remotes
	end
	return remote
end

local function remoteEvent(name)
	local remote = remotes:FindFirstChild(name)
	if not remote then
		remote = Instance.new("RemoteEvent")
		remote.Name = name
		remote.Parent = remotes
	end
	return remote
end

local requestSnapshot = remoteFunction("RequestSnapshot")
local spendLife = remoteFunction("SpendLife")
local setCheckpoint = remoteEvent("SetCheckpoint")
local completeLevel = remoteEvent("CompleteLevel")
local restartRun = remoteEvent("RestartRun")

local function snapshot(player)
	return {
		lives = LivesService.GetSnapshot(player),
		progress = ProgressionService.GetSnapshot(player),
		catalog = MonetizationService.GetClientCatalog()
	}
end

requestSnapshot.OnServerInvoke = function(player)
	return snapshot(player)
end

spendLife.OnServerInvoke = function(player, reason)
	LivesService.SpendLife(player, reason)
	return snapshot(player)
end

setCheckpoint.OnServerEvent:Connect(function(player, checkpointId)
	if typeof(checkpointId) == "string" then
		ProgressionService.SetCheckpoint(player, checkpointId)
	end
end)

completeLevel.OnServerEvent:Connect(function(player, levelId)
	if typeof(levelId) == "string" then
		ProgressionService.CompleteLevel(player, levelId)
	end
end)

restartRun.OnServerEvent:Connect(function(player)
	LivesService.ResetForRun(player)
	ProgressionService.RestartFromBeginning(player)
end)

MonetizationService.RegisterReceiptHandler("continue_run", function(player)
	LivesService.GrantLives(player, 1, "robux_continue")
	return true
end)

MonetizationService.RegisterReceiptHandler("extra_life_pack", function(player)
	LivesService.GrantLives(player, 3, "robux_extra_life_pack")
	return true
end)

LivesService.Start()
MonetizationService.Start()

Players.PlayerRemoving:Connect(function(player)
	ProgressionService.Clear(player)
end)

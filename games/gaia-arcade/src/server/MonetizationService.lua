local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")

local MonetizationService = {}

MonetizationService.Products = {
	continueRun = {
		id = 0,
		action = "continue_run",
		label = "Continue after game over"
	},
	extraLifePack = {
		id = 0,
		action = "extra_life_pack",
		label = "Extra lives pack"
	}
}

MonetizationService.GamePasses = {
	guardianSabana = { id = 0, skinId = "guardian_sabana" },
	obsidianaPulida = { id = 0, skinId = "obsidiana_pulida" },
	llamaAzul = { id = 0, skinId = "llama_azul" }
}

local receiptHandlers = {}

local function productById(productId)
	for _, product in pairs(MonetizationService.Products) do
		if product.id ~= 0 and product.id == productId then
			return product
		end
	end

	return nil
end

function MonetizationService.GetClientCatalog()
	return {
		products = MonetizationService.Products,
		gamePasses = MonetizationService.GamePasses
	}
end

function MonetizationService.RegisterReceiptHandler(action, handler)
	receiptHandlers[action] = handler
end

function MonetizationService.ProcessReceipt(receiptInfo)
	local player = Players:GetPlayerByUserId(receiptInfo.PlayerId)
	if not player then
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end

	local product = productById(receiptInfo.ProductId)
	if not product then
		warn(("Unknown Gaia Arcade product id: %s"):format(tostring(receiptInfo.ProductId)))
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end

	local handler = receiptHandlers[product.action]
	if not handler then
		warn(("No Gaia Arcade receipt handler for action: %s"):format(product.action))
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end

	local ok = handler(player, receiptInfo, product)
	if ok then
		return Enum.ProductPurchaseDecision.PurchaseGranted
	end

	return Enum.ProductPurchaseDecision.NotProcessedYet
end

function MonetizationService.Start()
	MarketplaceService.ProcessReceipt = MonetizationService.ProcessReceipt
end

return MonetizationService

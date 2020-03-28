#!/usr/bin/Rscript

library(readxl)
library(httr)

#Récupération du fichier excel
#url <- paste("https://www.ecdc.europa.eu/sites/default/files/documents/COVID-19-geographic-disbtribution-worldwide.xlsx")
url <- paste("https://www.ecdc.europa.eu/sites/default/files/documents/COVID-19-geographic-disbtribution-worldwide-",format(Sys.time(), "%Y-%m-%d"), ".xlsx", sep = "")

GET(url, authenticate(":", ":", type="ntlm"), write_disk(tf <- tempfile(fileext = ".xlsx")))
data <- read_excel(tf)
names(data)[names(data) == 'countriesAndTerritories'] <- 'countries'

#Sélection des données
dataF <- data[data$countries == "France" & (data$month >= 3 | (data$day >= 27 & data$month >= 2)) & (data$month != 12 & data$day != 31 & data$year != 2019), ]

#Régression linéaire pour les nouveaux cas
dataT <- dataF
zeroDay <- dataT$dateRep[nrow(dataT)]
dataT <- transform(dataT, dateRep = as.numeric(difftime(dateRep, zeroDay), units="days"))
dataT[,c(5)] <- log(dataT[,c(5)])
regression <- lm(dataT$cases ~ dataT$dateRep)

#Régression linéaire pour le nombre de morts
dataD <- dataT[dataT$day >= 6 & dataT$month >= 3,]
dataDT <- dataD
dataDT[,c(6)] <- log(dataDT[,c(6)])
regressionDeaths <- lm(dataDT$deaths ~ dataDT$dateRep)

#Coefficient de detérmination
r = summary(regression)$r.squared
rD = summary(regressionDeaths)$r.squared

#Graphique
png("result.png", width=480, height=480)
plot(dataT$dateRep,dataF$cases, main="Nouveaux cas de Coronavirus en France", xlab="Jours depuis le 27 février", ylab="Cas", col="orange")
points(dataD$dateRep, dataD$deaths, col="red")
courbe <- function(x) exp(coef(regression)[2]*x+coef(regression)[1])
courbeDeaths <- function(x) exp(coef(regressionDeaths)[2]*x+coef(regressionDeaths)[1])
dataT[,c(5)] <- courbe(dataT[,c(1)])
dataDT[,c(6)] <- courbeDeaths(dataDT[,c(1)])
lines(dataT$dateRep, dataT$cases, col="orange")
lines(dataD$dateRep, dataDT$deaths, col="red")
text(paste("r²(nouveaux cas) = ", round(r, digits=3)), x=0, y=3500, pos=4)
text(paste("r²(morts) = ", round(rD, digits=3)), x=0, y=3000, pos=4)
dev.off()

#Projections ssur la France
end <- (log(68000000) - coef(regression)[1])/coef(regression)[2]-dataT$dateRep[1]
endDeaths <- (log(68000000) - coef(regressionDeaths)[1])/coef(regressionDeaths)[2]-dataT$dateRep[1]

#Nombre total depuis le début
total <- sum(dataF$cases)
totalD <- sum(dataF$deaths)

#Renommage des variables pour le JSON
names(end) <- "end"
names(endDeaths) <- "endDeaths"
names(r) <- "rsquared"
names(rD) <- "rsquaredDeaths"
names(total) <- "total"
names(totalD) <- "totalD"
a <- coef(regression)[2]
b <- coef(regression)[1]
aD <- coef(regressionDeaths)[2]
bD <- coef(regressionDeaths)[1]
names(a) <- "a"
names(b) <- "b"
names(aD) <- "aD"
names(bD) <- "bD"
result <- c(dataF, a, b, aD, bD, end, endDeaths, r, rD, total, totalD)

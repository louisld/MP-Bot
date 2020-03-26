#!/usr/bin/Rscript

#these libraries are necessary

library(readxl)

library(httr)

#create the URL where the dataset is stored with automatic updates every day

#url <- paste("https://www.ecdc.europa.eu/sites/default/files/documents/COVID-19-geographic-disbtribution-worldwide-2020-03-23.xlsx")

url <- paste("https://www.ecdc.europa.eu/sites/default/files/documents/COVID-19-geographic-disbtribution-worldwide-",format(Sys.time(), "%Y-%m-%d"), ".xlsx", sep = "")

#download the dataset from the website to a local temporary file

GET(url, authenticate(":", ":", type="ntlm"), write_disk(tf <- tempfile(fileext = ".xlsx")))

#read the Dataset sheet into “R”

data <- read_excel(tf)
names(data)[names(data) == 'Countries and territories'] <- 'countries'

#Sélection des données
dataF <- data[data$countries == "France" & (data$Month >= 3 | (data$Day >= 27 & data$Month >= 2)) & (data$Month != 12 & data$Day != 31 & data$Year != 2019), ]

#Régression linéaire
dataT <- dataF
dataT[,c(5)] <- log(dataT[,c(5)])
zeroDay <- dataT$DateRep[nrow(dataT)]
dataT <- transform(dataT, DateRep = as.numeric(difftime(DateRep, zeroDay), units="days"))
regression <- lm(dataT$Cases ~ dataT$DateRep)

#Graphique
png("result.png", width=480, height=480)
plot(dataT$DateRep,dataF$Cases, main="Cas de Coronavirus en France", xlab="Jours depuis le 27 février", ylab="Cas")
courbe <- function(x) exp(coef(regression)[2]*x+coef(regression)[1])
dataT[,c(5)] <- courbe(dataT[,c(1)])
lines(dataT$DateRep, dataT$Cases, col="red")
dev.off()

end <- (log(68000000 - coef(regression)[1])/coef(regression)[2])-dataT$DateRep[1]

names(end) <- "end"
a <- coef(regression)[2]
b <- coef(regression)[1]
names(a) <- "a"
names(b) <- "b"
result <- c(dataF, a, b, end)

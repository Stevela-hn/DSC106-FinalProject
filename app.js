function project(){
    var filePath="michelin-2019.csv";
    question0(filePath);
    question1(filePath);
    question2(filePath);
    question3(filePath);
    question4(filePath);
    question5(filePath);
}

var question0=function(filePath){
    d3.csv(filePath).then(function(data){
        // take a look at the data
        console.log(data)
    });
}

// Scatterplot, scatter matrix with brushing
var question1=function(filePath){
    d3.csv(filePath).then(function(data){
        // process data
        var groupByCity = d3.rollup(data, v => v.length, d => d.city)
        var cityCounts = Array.from(groupByCity, ([key, value])=>({key, value}))
        // get cities with more than 2 michelin-awarded restaurants
        var filteredCity = cityCounts.filter(function(d){return d.value > 2})
        var legalCities = Array.from(filteredCity, ({key, value})=>(key))
        // get both average ratings and average price level w.r.t city
        var priceByCity = d3.rollup(data, v => d3.mean(v, d => parseInt(d.price.slice(-1))), d => d.city)
        var starByCity = d3.rollup(data, v => d3.mean(v, d => parseInt(d.star)), d => d.city)
        // concate infos
        info = []
        for (let i = 0; i < legalCities.length; i++) {
            cityName = legalCities[i]
            michCount = groupByCity.get(cityName)
            priceAvg = priceByCity.get(cityName)
            starAvg = starByCity.get(cityName)
            info.push({
                city: cityName,
                count: michCount,
                avg_price: priceAvg,
                avg_star: starAvg
            })
        }
        // start plotting
        console.log(info)
        // basic dimensions
        var margin = {top: 20, right: 30, bottom: 45, left: 60};
        var width = 1200 - margin.left - margin.right;
        var height = 600 - margin.top - margin.bottom;

        // initiate SVG
        var svg = d3.select("#q1_plot")
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform",
                      "translate(" + margin.left + "," + margin.top + ")");

        // padding between the two plots
        padding = 50

        // scales to go
        // x-scales
        var countMax = d3.max(info, function(d){return d.count})
        xScaleLeft = d3.scaleLinear()
                   .domain([0, 1.2*countMax])
                   .range([0, width/2 - padding])

        xScaleRight = d3.scaleLinear()
                        .domain([0, 1.2*countMax])
                        .range([width/2 + padding, width])

        // y-scales
        var starMax = d3.max(info, function(d){return d.avg_star})
        var priceMax = d3.max(info, function(d){return d.avg_price})

        starScale = d3.scaleLinear()
                      .domain([0, 1.2*starMax])
                      .range([height, 0])

        priceScale = d3.scaleLinear()
                       .domain([0, 1.2*priceMax])
                       .range([height, 0])

        // x-axises
        svg.append("g")
           .attr("transform", "translate(0," + height + ")")
           .call(d3.axisBottom(xScaleLeft))

        svg.append("g")
           .attr("transform", "translate(0," + height + ")")
           .call(d3.axisBottom(xScaleRight))

        // y-axises
        svg.append("g").call(d3.axisLeft(starScale))
        svg.append("g")
           .attr("transform", "translate(" + (width/2 + padding) + ",0)")
           .call(d3.axisLeft(priceScale))

        // left plot circles
        var leftCircle = svg.append("g")

                            .selectAll("leftCircle")
                            .data(info)
                            .enter()
                            .append("circle")
                              .attr("cx", function(d){return xScaleLeft(d.count)})
                              .attr("cy", function(d){return starScale(d.avg_star)})
                              .attr("r", 5)
                              .style("fill", "green")
                              .style("opacity", 0.5)

        var rightCircle = svg.append("g")
                              .selectAll("rightCircle")
                              .data(info)
                              .enter()
                              .append("circle")
                                .attr("cx", function(d){return xScaleRight(d.count)})
                                .attr("cy", function(d){return priceScale(d.avg_price)})
                                .attr("r", 4)
                                .style("fill", "blue")
                                .style("opacity", 0.5)

        
        svg.call(d3.brush()
                   .extent([[0, 0], [width/2 - padding, height]])
                   .on("start brush", brushstarted)
                // .on("brush", brushstarted)
                //    .on("end", brushended)
        )

        function brushstarted(event) {
            extent = event.selection
            var pool = []
            leftCircle.classed("selected", function(d){
                decide = isBrushed(extent, xScaleLeft(d.count), starScale(d.avg_star))
                if (decide) {
                    console.log(d)
                    pool.push(d.city)
                }
                return decide
            })
            rightCircle.classed("selected", function(d){
                return pool.includes(d.city)
            })//.style("fill", "red")
        }

        function isBrushed(brush_coords, cx, cy) {
            var x0 = brush_coords[0][0],
                x1 = brush_coords[1][0],
                y0 = brush_coords[0][1],
                y1 = brush_coords[1][1];
            return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
        }
    });
}

// Barplot
var question2=function(filePath){
    d3.csv(filePath).then(function(data){
        // process data
        grouped = d3.rollup(data, v => d3.sum(v, d => parseInt(d.star)), d => d.region)
        info = Array.from(grouped, ([key, value]) => ({key, value}))

        // start plotting
        // dimension initiation
        var margin = {top: 20, right: 30, bottom: 40, left: 90}
        var width = 1000 - margin.left - margin.right
        var height = 800 - margin.top - margin.bottom

        // SVG def.
        var svg = d3.select("#q2_plot")
                    .append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                        .attr("transform",
                            "translate(" + margin.left + "," + margin.top + ")");

        // x-axis
        var globalMax = d3.max(info, function(d){return d.value})
        var xScale = d3.scaleLinear()
                       .domain([0, 1.1*globalMax])
                       .range([0, width])
        
        svg.append("g")
           .attr("transform", "translate(0," + height + ")")
           .call(d3.axisBottom(xScale))
           .selectAll("text")
            .attr("transform", "translate(0,0)rotate(-30)")
            .style("text-anchor", "end");

        // y-axis
        var regions = Array.from(info, ({key, value})=>(key))
        var yScale = d3.scaleBand()
                  .domain(regions)
                  .range([0, height])
                  .padding([.1])

        svg.append("g")
           .call(d3.axisLeft(yScale))

        // add bars
        svg.selectAll("myRectangles")
           .data(info)
           .enter()
           .append("rect")
           .attr("x", xScale(0))
           .attr("y", function(d){return yScale(d.key)})
           .attr("width", function(d){return xScale(d.value)})
           .attr("height", yScale.bandwidth())
           .style("fill", "pink")
           .style("stroke", "black")
           .style("stroke-width", 0.7)

        // add text
        svg.selectAll("myLabels")
           .data(info)
           .enter()
           .append("text")
           .attr("x", function(d){
               return xScale(d.value) + 10
           })
           .attr("y", function(d){
               return yScale(d.key) + yScale.bandwidth()*3/4
           })
           .text(function(d){return d.value.toString()})
           .style("fill", "#69b3a2")
    })
}

// Stacked Barplot, stack-to-grouped with button
var question3=function(filePath){
    d3.csv(filePath).then(function(data){
        // process data
        // get most popular cuisines
        var cGrouped = d3.rollup(data, v => v.length, d => d.cuisine)
        var cCount = Array.from(cGrouped, ([key, value]) => ({key, value}))
        cCount.sort(function(a, b){return b.value - a.value})
        var popCuisines = Array.from(cCount.slice(0, 20), ({key, value}) => (key)) // popular cuisines
        
        // get star counts
        var starGrouped = d3.rollup(data, v => v.length, d => d.cuisine, d => d.star)

        popCuisines.sort()
        // merge
        var info = []
        for (let i = 0; i < popCuisines.length; i++){
            var cuisineItem = popCuisines[i]
            var starMap = starGrouped.get(cuisineItem)
            var starOne = starMap.get("1")
            var starTwo = starMap.get("2")
            var starThree = starMap.get("3")
            // check nan cases
            if (starOne == null){
                starOne = 0
            }
            if (starTwo == null){
                starTwo = 0
            }
            if (starThree == null){
                starThree = 0
            }
            // push into the merged data
            info.push({
                "cuisine": cuisineItem,
                "1-star": starOne,
                "2-star": starTwo,
                "3-star": starThree
            })
        }

        // specify the group and subgroup dimension
        subgroupLength = 3
        groupLength = info.length
        subgroupCategory = ['1-star', '2-star', '3-star']

        // necessary generated variables
        // var xz = popCuisines,
        //     yz = subgroupCategory,
        stacked = d3.stack().keys(subgroupCategory)(info)
        yMax = d3.max(info, function(d){return d3.max([d["1-star"], d["2-star"], d["3-star"]])})
        y1Max = d3.max(stacked, function(y) { return d3.max(y, function(d) { return d[1]; }); });


        // dimension initiation
        var margin = {top: 20, right: 30, bottom: 80, left: 90}
        var width = 900 - margin.left - margin.right
        var height = 600 - margin.top - margin.bottom


        // SVG def.
        var svg = d3.select("#q3_plot")
                    .append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)

        g = svg.append("g")
                        .attr("transform",
                            "translate(" + margin.left + "," + margin.top + ")");

        // x-Scale and x-axis
        var xScale = d3.scaleBand()
                       .domain(popCuisines)
                       .range([0, width])
                       .padding([0.2])

        g.append("g")
         .attr("class", "x-axis")
         .attr("transform", "translate(0," + height + ")")
         .call(d3.axisBottom(xScale))
         .selectAll("text")
         .attr("transform", "translate(0,0)rotate(-30)")
            .style("text-anchor", "end");

        // y-Scale and y-axis
        var groupedMax = d3.max(info, function(d){return d3.max([d["1-star"], d["2-star"], d["3-star"]])})
        var yScale = d3.scaleLinear()
                       .domain([0, y1Max])
                       .range([height, 0])

        g.append("g")
         .attr("class", "x-axis")
         .call(d3.axisLeft(yScale))


        // from the assignment
        // d3.select("#radio_q3")
        //   .selectAll("myOptions")
        //   .data(subgroupCategory)
        //   .enter()
        //   .append("option")
        //   .attr("value", function(d) {
        //         return d;
        // })

        

        // color-Scale
        var colors = ["#80b1d3", "#7121ea", "#69b3a2"]
        var colorScale = d3.scaleOrdinal()
                           .domain(subgroupCategory)
                           .range(colors)

        // series
        var series = g.selectAll(".series")
                      .data(stacked)
                      .enter()
                      .append("g")
                      .attr("fill", function(d){return colorScale(d.key);})

        var rect = series.selectAll("rect")
                         .data(function(d){return d;})
                         .enter()
                         .append("rect")
                         .attr("x", function(d){return xScale(d.data.cuisine)})
                         .attr("y", height)
                         .attr("width", xScale.bandwidth())
                         .attr("height", 0)

        rect.transition()
            .delay(function(d, i) { return i * 10; })
            .attr("y", function(d) { return yScale(d[1]); })
            .attr("height", function(d) { return yScale(d[0]) - yScale(d[1]); });

        d3.select("#radio_q3").on("change", changed)

        function changed(event, d) {
            // timeout.stop();
            let selected = event.target.value
            if (selected === "Grouped") transitionGrouped();
            else transitionStacked();
        } 

        function transitionGrouped() {
            yScale.domain([0, yMax]);
          
            rect.transition()
                .duration(500)
                .delay(function(d, i) { return i * 10; })
                .attr("x", function(d) {
                    // console.log(xScale(d.data.cuisine))
                    return xScale(d.data.cuisine) + xScale.bandwidth() / subgroupLength * subgroupCategory.indexOf(this.parentNode.__data__.key);
                })
                .attr("width", xScale.bandwidth() / subgroupLength)
              .transition()
                .attr("y", function(d) { return yScale(d[1] - d[0]); })
                .attr("height", function(d) { return yScale(0) - yScale(d[1] - d[0]); });
        }

        function transitionStacked() {
            yScale.domain([0, y1Max]);
          
            rect.transition()
                .duration(500)
                .delay(function(d, i) { return i * 10; })
                .attr("y", function(d) { return yScale(d[1]); })
                .attr("height", function(d) { return yScale(d[0]) - yScale(d[1]); })
              .transition()
                .attr("x", function(d, i) { return xScale(d.data.cuisine); })
                .attr("width", xScale.bandwidth());
        }

        // legends
        svg.selectAll("mydots")
           .data(subgroupCategory)
           .enter()
           .append("circle")
               .attr("cx", 800)
               .attr("cy", function(d, i){return 100 + i*25})
               .attr("r", 7)
               .style("fill", function(d){return colorScale(d)})

        svg.selectAll("mylabels")
            .data(subgroupCategory)
            .enter()
            .append("text")
                .attr("x", 820)
                .attr("y", function(d,i){ return 100 + i*25})
                .style("fill", function(d){ return 'black'})
                .text(function(d){ return d})
                .attr("text-anchor", "left")
                .style("alignment-baseline", "middle")
                    
    })
}

// Bubble Map, with button and labels
var question4=function(filePath){
    d3.csv(filePath).then(function(data){
        // setting up to avoid digit-beginning html class selectors(illegal)
        const digitMapping = new Map();
        digitMapping.set("1", "one")
        digitMapping.set("2", "two")
        digitMapping.set("3", "three")
        // convert price level to integer
        var info = []
        for (let i = 0; i < data.length; i++) {
            var item = data[i]
            info.push({
                name: item.name,
                city: item.city,
                cuisine: item.cuisine,
                latitude: parseFloat(item.latitude),
                longitude: parseFloat(item.longitude),
                price_level: parseInt(item.price.slice(-1)),
                star: digitMapping.get(item.star)+"-star"
            })
        }
        // start plot
        d3.json("world.json").then(function(mapData){
            // visualize the map (countries)
            var width = 1200
            var height = 600

            // project def.
            var projection = d3.geoNaturalEarth1()
                               //.translate([width/2, height/2])

            // define the path
            var path = d3.geoPath().projection(projection)

            // SVG for map
            var svg = d3.select("#q4_plot")
                        .append("svg")
                        .attr("width", width)
                        .attr("height", height)

            // continents
            svg.selectAll("path")
               .data(mapData.features)
               .enter()
               .append("path")
               .attr("d", path)
               .style("stroke", "white")
               .style("stroke-width", 0.5)
               .style("fill", "#287AB8")
               .style("opacity", .8)

            // radius scaler
            var localMin = d3.min(info, d => d.price_level)
            var localMax = d3.max(info, d => d.price_level)
            var rScale = d3.scaleLinear()
                           .domain([localMin, localMax])
                           .range([0.1, 1.5])

            // color scaler
            subgroupCategory = ['1-star', '2-star', '3-star']
            colors = [ "#402D54", "#D18975", "yellow"]
            var colorScale = d3.scaleOrdinal()
                            .domain(subgroupCategory)
                            .range(colors)

            // labeling
            // create a tooltip
            var Tooltip = d3.select("#q4_plot")
                            .append("div")
                            .attr("class", "tooltip")
                            .style("opacity", 0)
                            .style('position', 'absolute')
                            .style("background-color", "white")
                            .style("border", "solid")
                            .style("border-width", "2px")
                            .style("border-radius", "5px")
                            .style("padding", "5px")

            // Three function that change the tooltip when user hover / move / leave a cell
            var mouseover = function(event, d) {
                //Tooltip
                Tooltip.style("opacity", 1)
                d3.select(this).style("stroke", "black")//.style("stroke-width", 10)
            }
            var mousemove = function(event, d) {
                Tooltip.html(d.name + "<br>" + "Located City: " + d.city + "<br>" + "Cuisine: " + d.cuisine)
                // .style("left", (d3.select(this).attr("cy")) + "px")
                // .style("top", (d3.select(this).attr("cx"))+ "px")
                return Tooltip.style("top", (event.pageY)+"px").style("left", (event.pageX)+"px")
            }
            var mouseleave = function(event, d) {
                Tooltip.style("opacity", 0)
                d3.select(this)
                .style("stroke", "none")
                .style("opacity", 0.8)
            }
            // dots
            svg.selectAll("myCircles")
               .data(info)
               .join("circle")
                 .attr("class", d => d.star)
                 .attr("cx", d => projection([d.longitude, d.latitude])[0])
                 .attr("cy", d => projection([d.longitude, d.latitude])[1])
                 .attr("r", d => rScale(d.price_level))
                 .style("fill", d => colorScale(d.star))
                 .attr("stroke", d => colorScale(d.star))
                 .attr("stroke-width", 0.1)
                 .attr("fill-opacity", 0.5)
                 .on("mouseover", mouseover)
                 .on("mousemove", mousemove)
                 .on("mouseleave", mouseleave)


            // update by checkbox
            function update(){
                d3.selectAll(".checkbox").each(function(d){
                    cb = d3.select(this);
                    grp = cb.property("value")

                    var num = grp.slice(0,1)
                    grp = grp.replace(num, digitMapping.get(num))

                    // show the group when checked
                    if(cb.property("checked")){
                      svg.selectAll("."+grp).transition().duration(1000).style("opacity", 1).attr("r", function(d){ return rScale(d.price_level) })
            
                    // hide it
                    }else{
                      svg.selectAll("."+grp).transition().duration(1000).style("opacity", 0).attr("r", 0)
                    }
                  })
            }

            d3.selectAll(".checkbox").on("change",update);

            update()

            // legends
            var size = 15
            svg.selectAll("mydots")
            .data(subgroupCategory)
            .enter()
            .append("rect")
                .attr("x", 1000)
                .attr("y", function(d, i){return 100 + i*25})
                .attr("width", size)
                .attr("height", size)
                .style("fill", function(d){return colorScale(d)})

            svg.selectAll("mylabels")
                .data(subgroupCategory)
                .enter()
                .append("text")
                    .attr("x", 1020)
                    .attr("y", function(d,i){ return 101 + i*25 + size/2})
                    .style("fill", function(d){ return 'black'})
                    .text(function(d){ return d})
                    .attr("text-anchor", "left")
                    .style("alignment-baseline", "middle")
                    .attr("font-size", 14)

            // zooming
            var zoom = d3.zoom()
                        .scaleExtent([1, 12])
                        .extent([[0, 0], [width, height]])
                        .on("zoom", updateChart)

            svg.call(zoom)

            
            function updateChart(event, d) {

                svg.selectAll("path").attr("transform", event.transform)
                svg.selectAll("circle").attr("transform", event.transform)
            }
        })
    })
}

// Boxplot
var question5=function(filePath){
    d3.csv(filePath).then(function(data){
        // append SVG
        var margin = {top: 10, right: 30, bottom: 30, left: 40},
            width = 500 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        var svg = d3.select("#q5_plot")
                    .append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                        .attr("transform",
                            "translate(" + margin.left + "," + margin.top + ")");

        converted = data.map(function(g){return parseInt(g.price.slice(-1))})

        newData = []
        for (let j = 0; j < converted.length; j++){
            newData.push({
                price: converted[j],
                star: data[j].star,
                starString: data[j].star.toString() + "-star"
            })
        }

        console.log(d3.max(newData, function(x){return x.price}))
        // process the data
        var sumstat = d3//.group(function(d){return d.star})
                        .rollup(newData, function(d) {
                            q1 = d3.quantile(d.map(function(g) { return g.price}).sort(d3.ascending),.25)
                            median = d3.quantile(d.map(function(g) { return g.price}).sort(d3.ascending),.5)
                            q3 = d3.quantile(d.map(function(g) { return g.price}).sort(d3.ascending),.75)
                            // console.log(q3)
                            // console.log(q3)
                            interQuantileRange = q3 - q1
                            min = q1 - 1.5 * interQuantileRange
                            max = q3 + 1.5 * interQuantileRange
                            // console.log(interQuantileRange)
                            return({q1: q1, median: median, q3: q3, interQuantileRange: interQuantileRange, min: min, max: max})
                        }, d => d.star)

        // console.log(sumstat)

        // x-axis
        var xScale = d3.scaleBand()
                       .range([0, width])
                       .domain(["1-star", "2-star", "3-star"])
                       .paddingInner(1)
                       .paddingOuter(0.5)
        svg.append("g")
           .attr("transform", "translate(0," + height + ")")
           .call(d3.axisBottom(xScale))

        // y-axis
        var globalMax = d3.max(newData, function(d){return d.price})
        var globalMin = d3.min(newData, function(d){return d.price})
        var yScale = d3.scaleLinear()
                       .domain([-2*globalMin, 2*globalMax])
                       .range([height, 0])
        svg.append("g").call(d3.axisLeft(yScale))

        stats = Array.from(sumstat, ([key, value]) => ({key, value}))
        console.log(stats)

        // main vertical line
        svg.selectAll("vertLines")
            .data(stats)
            .enter()
            .append("line")
            .attr("x1", function(d){return(xScale(d.key + "-star"))})
            .attr("x2", function(d){return(xScale(d.key + "-star"))})
            .attr("y1", function(d){return(yScale(d.value.min))})
            .attr("y2", function(d){return(yScale(d.value.max))})
            .attr("stroke", "black")
            .style("width", 40)

        // boxes
        var boxWidth = 100
        svg
            .selectAll("boxes")
            .data(stats)
            .enter()
            .append("rect")
                .attr("x", function(d){return(xScale(d.key + "-star")-boxWidth/2)})
                .attr("y", function(d){return(yScale(d.value.q3))})
                .attr("height", function(d){return(yScale(d.value.q1)-yScale(d.value.q3))})
                .attr("width", boxWidth )
                .attr("stroke", "black")
                .style("fill", "#69b3a2")


        // median
        svg
        .selectAll("medianLines")
        .data(stats)
        .enter()
        .append("line")
            .attr("x1", function(d){return(xScale(d.key + "-star")-boxWidth/2) })
            .attr("x2", function(d){return(xScale(d.key + "-star")+boxWidth/2) })
            .attr("y1", function(d){return(yScale(d.value.median))})
            .attr("y2", function(d){return(yScale(d.value.median))})
            .attr("stroke", "red")
            .attr("stroke-width", 3)
            .attr("stroke-opacity", .6)
            .style("width", 80)

        console.log(sumstat)
        outliers = []
        for (let i = 0; i < newData.length; i++) {
            piece = newData[i]
            starGet = piece.star.toString()
            statVal = sumstat.get(starGet)
            if (piece.price > statVal.max || piece.price < statVal.min) {
                outliers.push(piece)
            }
        }

        // display the outliers
        var jitterWidth = 50
        svg
        .selectAll("indPoints")
        .data(outliers)
        .enter()
        .append("circle")
            .attr("cx", function(d){return(xScale(d.star+"-star") - jitterWidth/2 + Math.random()*jitterWidth )})
            .attr("cy", function(d){return(yScale(d.price))})
            .attr("r", 2)
            .style("fill", "white")
            .attr("stroke", "black")
    })
}
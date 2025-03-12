// feel free to change any part of the code
class Scatterplot {
    constructor(containerId, data) {
        console.log("Scatterplot Debug: Constructor start");
        console.log("Scatterplot Debug: Constructor called");
        console.log("Scatterplot Debug: Container ID:", containerId);
        console.log("Scatterplot Debug: Raw data length:", data?.length);
        
        this.containerId = containerId;
        // Remove entries with zero scores
        this.data = data.filter(d => 
            d.scores_overall > 0 && 
            d.scores_teaching > 0 && 
            d.scores_international_outlook > 0 && 
            d.scores_industry_income > 0 && 
            d.scores_research > 0 && 
            d.scores_citations > 0
        );
        console.log("Scatterplot Debug: Filtered data length:", this.data.length);
        console.log("Scatterplot Debug: Sample data point:", this.data[0]);
        
        // Define variables in priority order
        this.variables = [
            { name: 'scores_overall', label: 'Overall Score', priority: 0 },
            { name: 'scores_research', label: 'Research Score', priority: 1 },
            { name: 'scores_citations', label: 'Citation Score', priority: 2 },
            { name: 'scores_industry_income', label: 'Industry Income Score', priority: 3 },
            { name: 'scores_international_outlook', label: 'International Outlook Score', priority: 4 },
            { name: 'scores_teaching', label: 'Teaching Score', priority: 5 }
        ];
        
        // Get year range and set default year
        this.yearRange = {
            min: d3.min(this.data, d => d.year),
            max: d3.max(this.data, d => d.year)
        };
        this.selectedYear = this.yearRange.max;
        
        // Default selected variables (Overall Score and Research Score)
        this.selectedVariables = [this.variables[0], this.variables[1]];
        
        console.log("Scatterplot Debug: Selected variables:", this.selectedVariables);
        console.log("Scatterplot Debug: Year range:", this.yearRange);
        
        // After setting selectedYear and selectedVariables
        console.log("Scatterplot Debug: Initial state:", {
            selectedYear: this.selectedYear,
            selectedVariables: this.selectedVariables,
            dataPoints: this.data.length,
            yearRange: this.yearRange
        });
        
        this.initVis();
    }

    initVis() {
        const vis = this;
        console.log("Scatterplot Debug: Starting initVis");

        // Clear any existing content
        const containerElement = document.getElementById(vis.containerId);
        containerElement.innerHTML = '';
        
        // Create main container with two-panel layout
        const container = d3.select("#" + vis.containerId)
            .style("display", "grid")
            .style("grid-template-columns", "40% 60%")  // 40% left, 60% right
            .style("width", "100%")
            .style("height", "100vh")
            .style("gap", "20px")
            .style("padding", "20px");

        console.log("Scatterplot Debug: Main container created");

        // Left panel container (for hexagon and slider)
        const leftPanel = container.append("div")
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("height", "100%")
            .style("gap", "20px");

        // Calculate heights for hexagon container (70% of its previous height)
        const totalHeight = containerElement.clientHeight;
        const hexagonHeight = Math.floor(totalHeight * 0.7 * 0.7); // 70% of previous 100%
        const sliderHeight = 100; // Fixed height for slider

        // Hexagon container (top of left panel)
        vis.hexagonContainer = leftPanel.append("div")
            .attr("class", "hexagon-container")
            .style("height", `${hexagonHeight}px`)  // Set specific height
            .style("display", "flex")
            .style("justify-content", "center")
            .style("align-items", "center");

        console.log("Scatterplot Debug: Hexagon container created");

        // Slider container (bottom of left panel)
        vis.sliderContainer = leftPanel.append("div")
            .attr("class", "slider-container")
            .style("height", `${sliderHeight}px`)
            .style("padding", "20px")
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("justify-content", "center");

        console.log("Scatterplot Debug: Slider container created");

        // Right panel for plot
        vis.plotContainer = container.append("div")
            .attr("class", "plot-container")
            .style("width", "100%")
            .style("height", "100%");

        console.log("Scatterplot Debug: Plot container created");

        console.log("Scatterplot Debug: Container heights:", {
            totalHeight: totalHeight,
            hexagonHeight: hexagonHeight,
            sliderHeight: sliderHeight
        });

        // Initialize components
        this.initHexagonSelector();
        this.initPlot();
        this.initYearSlider();
        this.render();

        // Debug final container states
        console.log("Scatterplot Debug: Final container states:", {
            leftPanel: {
                element: leftPanel.node(),
                dimensions: {
                    clientWidth: leftPanel.node().clientWidth,
                    clientHeight: leftPanel.node().clientHeight
                }
            },
            hexagonContainer: {
                element: vis.hexagonContainer.node(),
                dimensions: {
                    clientWidth: vis.hexagonContainer.node().clientWidth,
                    clientHeight: vis.hexagonContainer.node().clientHeight
                }
            },
            sliderContainer: {
                element: vis.sliderContainer.node(),
                dimensions: {
                    clientWidth: vis.sliderContainer.node().clientWidth,
                    clientHeight: vis.sliderContainer.node().clientHeight
                }
            },
            plotContainer: {
                element: vis.plotContainer.node(),
                dimensions: {
                    clientWidth: vis.plotContainer.node().clientWidth,
                    clientHeight: vis.plotContainer.node().clientHeight
                }
            }
        });
    }

    initHexagonSelector() {
        const vis = this;
        console.log("Scatterplot Debug: Initializing hexagon selector");
        
        // Create SVG with adjusted dimensions
        vis.hexagonSvg = vis.hexagonContainer.append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", "0 0 300 300")
            .style("max-height", "100%")  // Ensure it fits in container
            .style("overflow", "visible");

        // Calculate hexagon layout
        const radius = 100;
        const center = { x: 150, y: 150 };
        
        // Calculate vertex positions (starting from top, clockwise)
        vis.vertices = vis.variables.map((_, i) => {
            const angle = (i * Math.PI / 3) - Math.PI / 2; // Start from top
            return {
                x: center.x + radius * Math.cos(angle),
                y: center.y + radius * Math.sin(angle)
            };
        });

        // Create lines between all vertices
        vis.lines = [];
        for (let i = 0; i < vis.vertices.length; i++) {
            for (let j = i + 1; j < vis.vertices.length; j++) {
                vis.lines.push({
                    source: vis.vertices[i],
                    target: vis.vertices[j],
                    variables: [vis.variables[i], vis.variables[j]]
                });
            }
        }

        // Draw lines
        vis.hexagonSvg.selectAll(".variable-line")
            .data(vis.lines)
            .join("line")
            .attr("class", "variable-line")
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y)
            .style("stroke", "#cccccc")
            .style("stroke-width", 2)
            .style("opacity", 0.5)
            .on("click", function(event, d) {
                vis.selectVariables(d.variables);
            });

        // Draw vertices
        vis.hexagonSvg.selectAll(".variable-circle")
            .data(vis.vertices)
            .join("circle")
            .attr("class", "variable-circle")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", 10)
            .style("fill", "#add8e6")
            .style("stroke", "#666");

        // Add labels
        vis.hexagonSvg.selectAll(".variable-label")
            .data(vis.variables)
            .join("text")
            .attr("class", "variable-label")
            .attr("x", (d, i) => vis.vertices[i].x)
            .attr("y", (d, i) => vis.vertices[i].y + 20)
            .attr("text-anchor", "middle")
            .text(d => d.label);

        // Highlight default selection
        this.updateHexagonSelection();
    }

    initPlot() {
        const vis = this;
        console.log("Scatterplot Debug: InitPlot start");
        
        // Set up margins and dimensions
        vis.margin = { top: 40, right: 20, bottom: 40, left: 60 };
        vis.width = vis.plotContainer.node().clientWidth - vis.margin.left - vis.margin.right;
        vis.height = vis.plotContainer.node().clientHeight - vis.margin.top - vis.margin.bottom;
        
        console.log("Scatterplot Debug: Plot dimensions:", {
            width: vis.width,
            height: vis.height,
            margins: vis.margin
        });

        // Create SVG
        vis.svg = vis.plotContainer.append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left},${vis.margin.top})`);

        console.log("Scatterplot Debug: SVG created");

        // Initialize scales
        vis.x = d3.scaleLinear()
            .range([0, vis.width]);
        vis.y = d3.scaleLinear()
            .range([vis.height, 0]);
        
        console.log("Scatterplot Debug: Scales initialized");

        // Initialize axes with labels
        vis.xAxis = d3.axisBottom(vis.x)
            .ticks(5)
            .tickFormat(d => d);
        vis.yAxis = d3.axisLeft(vis.y)
            .ticks(5)
            .tickFormat(d => d);
        
        console.log("Scatterplot Debug: Axes initialized");

        // Add axes groups
        vis.xAxisGroup = vis.svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${vis.height})`);
        
        vis.yAxisGroup = vis.svg.append("g")
            .attr("class", "y-axis");
        
        console.log("Scatterplot Debug: Axis groups created");

        // Add axis labels
        vis.svg.append("text")
            .attr("class", "x-axis-label")
            .attr("x", vis.width / 2)
            .attr("y", vis.height + 35)
            .style("text-anchor", "middle")
            .text("X-Axis Label");

        vis.svg.append("text")
            .attr("class", "y-axis-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -vis.height / 2)
            .attr("y", -45)
            .style("text-anchor", "middle")
            .text("Y-Axis Label");
        
        console.log("Scatterplot Debug: Axis labels added");

        // Add title
        vis.title = vis.svg.append("text")
            .attr("class", "plot-title")
            .attr("x", vis.width / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle");
        
        console.log("Scatterplot Debug: Title element created:", {
            titleElement: vis.title.node(),
            exists: vis.title.node() !== null
        });
        
        // Initial title update
        this.updateTitle();
    }

    initYearSlider() {
        const vis = this;
        console.log("Scatterplot Debug: Initializing year slider");

        // Clear existing content
        vis.sliderContainer.selectAll("*").remove();

        // Add year label
        vis.sliderContainer.append("div")
            .style("text-align", "center")
            .style("margin-bottom", "10px")
            .style("font-weight", "bold")
            .text("Select Year");

        // Create slider
        vis.slider = vis.sliderContainer.append("input")
            .attr("type", "range")
            .attr("min", vis.yearRange.min)
            .attr("max", vis.yearRange.max)
            .attr("value", vis.selectedYear)
            .attr("step", 1)
            .style("width", "100%")
            .style("margin", "10px 0")
            .on("input", function() {
                vis.selectedYear = +this.value;
                console.log("Scatterplot Debug: Year changed to:", vis.selectedYear);
                vis.updateTitle();
                vis.render();
            });

        // Add year labels
        const labelContainer = vis.sliderContainer.append("div")
            .style("display", "flex")
            .style("justify-content", "space-between")
            .style("width", "100%")
            .style("padding", "0 10px");

        // Add year markers
        d3.range(vis.yearRange.min, vis.yearRange.max + 1).forEach(year => {
            labelContainer.append("span")
                .style("font-size", "12px")
                .style("color", "#666")
                .text(year);
        });

        console.log("Scatterplot Debug: Slider elements created:", {
            slider: vis.slider.node(),
            labelContainer: labelContainer.node()
        });
    }

    selectVariables(variables) {
        console.log("Scatterplot Debug: Selecting variables:", variables);
        const sorted = variables.sort((a, b) => a.priority - b.priority);
        this.selectedVariables = sorted;
        console.log("Scatterplot Debug: Sorted variables:", this.selectedVariables);
        
        // Update hexagon visualization
        this.updateHexagonSelection();
        
        // Update title before rendering
        this.updateTitle();
        
        // Render the updated visualization
        this.render();
    }

    updateHexagonSelection() {
        const vis = this;
        
        // Reset all lines and circles
        vis.hexagonSvg.selectAll(".variable-line")
            .style("stroke", "#cccccc")
            .style("stroke-width", 2)
            .style("opacity", 0.5);

        vis.hexagonSvg.selectAll(".variable-circle")
            .style("stroke-width", 1);

        // Highlight selected line and circles
        vis.hexagonSvg.selectAll(".variable-line")
            .filter(d => 
                (d.variables[0] === vis.selectedVariables[0] && d.variables[1] === vis.selectedVariables[1]) ||
                (d.variables[0] === vis.selectedVariables[1] && d.variables[1] === vis.selectedVariables[0])
            )
            .style("stroke", "#3498db")
            .style("stroke-width", 3)
            .style("opacity", 1);

        vis.hexagonSvg.selectAll(".variable-circle")
            .filter((d, i) => 
                vis.variables[i] === vis.selectedVariables[0] ||
                vis.variables[i] === vis.selectedVariables[1]
            )
            .style("stroke-width", 3);
    }

    updateTitle() {
        const vis = this;
        console.log("Scatterplot Debug: UpdateTitle called:", {
            titleElement: vis.title?.node(),
            selectedVariables: vis.selectedVariables,
            selectedYear: vis.selectedYear
        });

        if (!vis.title) {
            console.error("Scatterplot Debug: Title element missing");
            return;
        }

        const titleText = `${vis.selectedVariables[1]?.label} vs ${vis.selectedVariables[0]?.label} (${vis.selectedYear})`;
        vis.title.text(titleText);
        
        console.log("Scatterplot Debug: Title updated to:", {
            text: titleText,
            element: vis.title.node(),
            content: vis.title.text()
        });
    }

    renderTransition() {
        const vis = this;
        
        // Filter data for selected year
        const yearData = vis.data.filter(d => d.year === vis.selectedYear);
        
        // Update points with transition
        const points = vis.g.selectAll(".point")
            .data(yearData);
            
        // Exit
        points.exit()
            .transition()
            .duration(750)
            .attr("r", 0)
            .remove();
        
        // Enter
        const pointsEnter = points.enter()
            .append("circle")
            .attr("class", "point")
            .attr("r", 0)
            .attr("fill", "#3498db")
            .attr("opacity", 0.6);
            
        // Update + Enter
        points.merge(pointsEnter)
            .transition()
            .duration(750)
            .attr("cx", d => vis.x(d[vis.currentX]))
            .attr("cy", d => vis.y(d[vis.currentY]))
            .attr("r", 5);
    }

    updateAxisLabels() {
        const vis = this;
        console.log("Scatterplot Debug: Updating axis labels with:", {
            x: vis.selectedVariables[1]?.label,
            y: vis.selectedVariables[0]?.label
        });

        vis.svg.select(".x-axis-label")
            .text(vis.selectedVariables[1]?.label);
        
        vis.svg.select(".y-axis-label")
            .text(vis.selectedVariables[0]?.label);
    }

    render() {
        const vis = this;
        console.log("Scatterplot Debug: Render start:", {
            selectedYear: vis.selectedYear,
            selectedVariables: vis.selectedVariables?.map(v => v.label)
        });

        // Filter data for selected year
        const yearData = vis.data.filter(d => d.year === vis.selectedYear);
        console.log("Scatterplot Debug: Filtered data:", {
            year: vis.selectedYear,
            dataPoints: yearData.length,
            samplePoint: yearData[0],
            variables: {
                x: vis.selectedVariables[1]?.name,
                y: vis.selectedVariables[0]?.name
            }
        });

        // Update scales
        vis.x.domain([0, 100]);
        vis.y.domain([0, 100]);
        
        console.log("Scatterplot Debug: Updated scale domains");

        // Update axes
        try {
            vis.xAxisGroup.call(vis.xAxis);
            vis.yAxisGroup.call(vis.yAxis);
            console.log("Scatterplot Debug: Axes updated successfully");
        } catch (error) {
            console.error("Scatterplot Debug: Error updating axes:", error);
        }

        // Update axis labels
        vis.updateAxisLabels();

        // Update points with detailed debugging
        try {
            const points = vis.svg.selectAll(".point")
                .data(yearData);
            
            console.log("Scatterplot Debug: Points update:", {
                totalPoints: yearData.length,
                enter: points.enter().size(),
                exit: points.exit().size(),
                update: points.size()
            });

            // Enter + Update points
            points.enter()
                .append("circle")
                .attr("class", "point")
                .merge(points)
                .attr("cx", d => {
                    const x = vis.x(d[vis.selectedVariables[1].name]);
                    if (isNaN(x)) {
                        console.error("Scatterplot Debug: Invalid x value:", {
                            raw: d[vis.selectedVariables[1].name],
                            scaled: x,
                            point: d
                        });
                    }
                    return x;
                })
                .attr("cy", d => {
                    const y = vis.y(d[vis.selectedVariables[0].name]);
                    if (isNaN(y)) {
                        console.error("Scatterplot Debug: Invalid y value:", {
                            raw: d[vis.selectedVariables[0].name],
                            scaled: y,
                            point: d
                        });
                    }
                    return y;
                })
                .attr("r", 5)
                .attr("fill", "#3498db")
                .attr("opacity", 0.6);

            points.exit().remove();
            
            console.log("Scatterplot Debug: Points updated successfully");
        } catch (error) {
            console.error("Scatterplot Debug: Error updating points:", error);
        }
    }
}

// Add these styles to ensure proper layout and slider appearance
const styles = `
    #${vis.containerId} {
        width: 100%;
        height: 100vh;
        margin: 0;
        padding: 0;
        overflow: hidden;
    }

    .slider-container input[type="range"] {
        -webkit-appearance: none;
        width: 100%;
        height: 8px;
        border-radius: 4px;
        background: #ddd;
        outline: none;
        margin: 10px 0;
    }

    .slider-container input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #3498db;
        cursor: pointer;
    }

    .slider-container input[type="range"]::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #3498db;
        cursor: pointer;
    }

    /* Hide any existing year filter dropdowns */
    select[id*="year"] {
        display: none !important;
    }
`;

// Add the styles to the document
const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

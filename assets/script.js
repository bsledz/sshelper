const {desktopCapturer, ipcRenderer} = require('electron')


$(document).ready(function () {
    initStore()
    render()

    $( "#sortable" ).sortable({
        update: function(event) {
            console.log("drop")
            let ids = []
            let events = []
            let should_be = 0
            let event_changed = null
            $("#sortable > div").each(function(e) {
                let index = $(this).data("index")
                if(should_be !== index && event_changed === null){
                    event_changed = store.events[index]
                }
                should_be++;
                ids.push(index)
            })
            for(let index = 0; index < ids.length;index++){
                events.push(store.events[ids[index]])
            }
            store.events = events
            store.current = store.events.indexOf(event_changed)
            render()
        }
    });

})

var store = {}

var MSEVENT = "M"
var KBEVENT = "K"
var SSEVENT = "Screenshot"
var WAITEVENT = "Wait for color"

var LMB = "LMB"

var x = 0;
var y = 1;

var mouse_pos = []

ipcRenderer.on('ADD_EVENT', (event, message) => {
    if (message.type === "SSEVENT") {
        add_ss_event()
    } else if (message.type === "MSEVENT") {
        add_ms_event([message.pos.x, message.pos.y])
        //add_ms_event(mouse_pos)
    }

})

function add_ms_event(pos) {
    let event = {
        type: MSEVENT,
        button: LMB,
        coords: pos,
        color: null
    }
    useCanvas($("#cs")[0], $("#img-container img")[0], function () {
        var p = $("#cs")[0].getContext('2d')
            .getImageData(pos[x], pos[y], 1, 1).data;
        event.color = [p[0], p[1], p[2]]
        //store.events.push(event)
        store.events.splice(store.current+1, 0, event);
        store.current = store.events.indexOf(event)
        render()

    });

}

function add_ss_event() {
    let event = {
        type: SSEVENT,
    }
    fullscreenScreenshot(function (base64data) {
        event.data = base64data
        //store.events.push(event)
        store.events.splice(store.current+1, 0, event);
        store.current = store.events.indexOf(event)
        render()
    }, 'image/png');


}

function initStore() {
    store["events"] = [
        //     {
        //     type: SSEVENT. dat
        // }, {
        //     type: MSEVENT, button: LMB, coords: [15, 15]
        // }
    ]
    store["current"] = null
}

$(document).on("click", ".remove-event", function () {
    let index = $(this).closest(".single_event").data("index")


    if(store.current === index){
        if (index > 0) {
            store.current--;
        }else if(index < store.events.length-1) {
            store.current++;
        }else {
            store.current = null;
        }
    }
    let current_el = store.events[store.current]
    store.events.splice(index, 1);
    store.current = store.events.indexOf(current_el)
    render()
})


$(document).on("click", ".single_event", function () {
    let index = $(this).data("index")
    store.current = index
    render()
})

$(document).on("click", "#img-container", function () {
    add_ms_event(mouse_pos)

})

function renderEvents() {
    let items = ""
    $.each(store["events"], function (event_index, event) {
        let item = ""
        item += '<div class="single_event ' + (event_index == store.current ? "red" : "white") + ' black-text" data-index="' + event_index + '">';
        if (event.type === MSEVENT) {
            item += "<b class='red-text white remove-event' style='padding-left:3px;padding-right:3px;'>X</b> " + event.type + ": <b>" + event.button + "</b> [" + event.coords[x] + ", " + event.coords[y] + "]";
            if (event.color != null) {
                item += "<br>RGB(" + event.color[0] + "," + event.color[1] + "," + event.color[2] + ")";
                item += "<span class='pixel' style='"
                item += "background-color: rgb(" + event.color[0] + "," + event.color[1] + "," + event.color[2] + ")"
                item += "'>  </span>"
            }
        } else
            item += "<b class='red-text white remove-event' style='padding-left:3px;padding-right:3px;'>X</b> " + event.type;
        item += '</div>';

        items += item
    })
    $(".events").html(items)

}

function selectImageToRender() {
    if (store.current !== null) {
        let event_index = store.current
        while (event_index >= 0) {
            console.log(event_index, store.events[event_index])
            if (store.events[event_index].type == SSEVENT) {
                break
            }
            event_index--
        }
        console.log("event_index", event_index)
        if (event_index >= 0) {
            renderImage(store.events[event_index])
        } else {
            $("#img-container img").attr("src", "assets/white.png")
        }
        console.log(event_index)
    }
}

var dot_width = 10

function renderImage(ssEvent) {
    let ssIndex = store.events.indexOf(ssEvent)
    let dots = ""
    let dots_count = 0;
    for (let i = ssIndex + 1; i < store.events.length; i++) {
        let event = store.events[i]
        let dot = ""
        if (event.type === SSEVENT) {
            break;
        }
        dots_count++
        dot += '<div class="dot pulse" '
        dot += 'style="left:' + event.coords[x] + "px;top:" + (event.coords[y] - dots_count * dot_width / 2 + dot_width / 2) + 'px;'
        if(i === store.current){
            dot+= "background-color:blue";
        }
        dot += '"'
        dot += '>'+i+'</div>'
        dots += dot
    }
    $("#img-container img").css("margin-top", "-" + (dots_count * dot_width / 2) + "px")

    $("#img-container").prepend(dots)
    $("#img-container img").attr("src", ssEvent.data)

}

function render() {
    $(".dot").remove()
    selectImageToRender()
    renderEvents()
    console.log(store)

}


$(document).mousemove(function (e) {
    let el = "#img-container"
    var relativePosition = {
        left: e.pageX + $(el).scrollLeft(),
        top: e.pageY + $(el).scrollTop(),
    };
    $('#xCoords').html(relativePosition.left);
    $('#yCoords').html(relativePosition.top);
    mouse_pos = [relativePosition.left, relativePosition.top]
    useCanvas($("#cs")[0], $("#img-container img")[0], function () {
        var p = $("#cs")[0].getContext('2d')
            .getImageData(relativePosition.left, relativePosition.top, 1, 1).data;
        $("#colorRGB").text("RGB(" + p[0] + "," + p[1] + "," + p[2] + ")")
        $("#pixel").css("background-color", "rgb(" + p[0] + "," + p[1] + "," + p[2] + ")")
        //$(".dot").css("margin-left", relativePosition.left + "px").css("margin-top", relativePosition.top + "px")

    });
});

function useCanvas(el, image, callback) {
    el.width = image.width;
    el.height = image.height;
    el.getContext('2d')
        .drawImage(image, 0, 0, image.width, image.height);
    return callback();
}

/**
 * Create a screenshot of the entire screen using the desktopCapturer module of Electron.
 *
 * @param callback {Function} callback receives as first parameter the base64 string of the image
 * @param imageFormat {String} Format of the image to generate ('image/jpeg' or 'image/png')
 **/
function fullscreenScreenshot(callback, imageFormat) {
    var _this = this;
    this.callback = callback;
    imageFormat = imageFormat || 'image/jpeg';

    this.handleStream = (stream) => {
        // Create hidden video tag
        var video = document.createElement('video');
        video.style.cssText = 'position:absolute;top:-10000px;left:-10000px;';


        // Event connected to stream
        video.onloadedmetadata = function () {
            // Set video ORIGINAL height (screenshot)
            video.style.height = this.videoHeight + 'px'; // videoHeight
            video.style.width = this.videoWidth + 'px'; // videoWidth

            video.play();

            // Create canvas
            var canvas = document.createElement('canvas');
            canvas.width = this.videoWidth;
            canvas.height = this.videoHeight;
            var ctx = canvas.getContext('2d');
            // Draw video on canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            if (_this.callback) {
                // Save screenshot to base64
                _this.callback(canvas.toDataURL(imageFormat));
            } else {
                console.log('Need callback!');
            }

            // Remove hidden video tag
            video.remove();
            try {
                // Destroy connect to stream
                stream.getTracks()[0].stop();
            } catch (e) {
            }
        }

        video.srcObject = stream;
        document.body.appendChild(video);
    };

    this.handleError = function (e) {
        console.log(e);
    };

    desktopCapturer.getSources({types: ['window', 'screen']}).then(async sources => {
        console.log(sources);

        for (const source of sources) {
            // Filter: main screen
            if ((source.name === "Entire screen") || (source.name === "Screen 1") || (source.name === "Screen 2") || (source.name === "Entire Screen")) {
                console.log("found")
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        audio: false,
                        video: {
                            mandatory: {
                                chromeMediaSource: 'desktop',
                                chromeMediaSourceId: source.id,
                                minWidth: 1280,
                                maxWidth: 4000,
                                minHeight: 720,
                                maxHeight: 4000
                            }
                        }
                    });
                    _this.handleStream(stream);
                } catch (e) {
                    _this.handleError(e);
                }
            }
        }
    });
}


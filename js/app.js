/*
    Written by https://ryncmrfrd.me.
    Documented script of https://github.com/ryncmrfrd/lifx/blob/master/js/app.min.js
*/

/*
    MY OWN JQUERY AJAX "API"
*/
var lifx = {
    auth: '',
    //start the api and get lifx.auth to your key
    start: function(key, sucCBK, errCBK){
        $.ajax({
            url: "https://api.lifx.com/v1/lights/all",
            headers: {'Authorization':'Bearer '+key},
            success: function(sucPARAMS){
                lifx.auth = key;
                if(sucPARAMS){lifx.callback(sucCBK, sucPARAMS)}
                else{lifx.callback(sucCBK)}
            },
            error: function(errPARAMS){
                if(errCBK){
                    lifx.callback(errCBK,errPARAMS)
                }
            }
        });
    },
    //get all lights and their details
    get: function(selector, sucCBK, errCBK){
        if(!lifx.auth){return;}
        $.ajax({
            url: "https://api.lifx.com/v1/lights/"+selector,
            headers: {'Authorization':'Bearer '+lifx.auth},
            success: function(sucPARAMS){
                if(sucPARAMS){lifx.callback(sucCBK, sucPARAMS)}
                else{lifx.callback(sucCBK)}
            },
            error: function(errPARAMS){
                if(errCBK){lifx.callback(errCBK,errPARAMS)}
            }
        });
    },
    //toggles the on/off state of the selected light
    toggle: function(selector, sucCBK){
        if(!lifx.auth){return;}
        $.ajax({
            url: "https://api.lifx.com/v1/lights/id:"+selector+"/toggle",
            headers: {'Authorization':'Bearer '+lifx.auth},
            type: 'POST',
            contentType: 'application/json',
            success: function(errPARAMS){
                var sucPARAMS = errPARAMS.results;
                if(errPARAMS    ){lifx.callback(sucCBK, sucPARAMS)}
                else{lifx.callback(sucCBK)}
            },
            error: function(errPARAMS){
                if(errCBK){
                    lifx.callback(errCBK,errPARAMS)
                }
            }
        });
    },
    //changes any light state ie. color, brightness, on/off (for that you could just use "lifx.toggle")
    changeState: function(selector, data, sucCBK, errCBK){
        if(!lifx.auth){return;}
        $.ajax({
            url: 'https://api.lifx.com/v1/lights/id:'+selector+'/state',
            headers: {'Authorization':'Bearer '+lifx.auth},
            type: 'PUT',
            dataType: 'json',
            contentType: 'application/json',
            processData: false,
            data: JSON.stringify(data),
            success: function(sucPARAMS){
                lifx.callback(sucCBK, sucPARAMS)
            },
            error: function(errPARAMS){
                if(errCBK){
                    lifx.callback(errCBK,errPARAMS)
                }
            }
        });
    },
    //boiletplate stuff for callbacks to work (and work with anonymous functions)
    callback: function(callback,params){if(arguments.length==0){console.error('Incorrect function parameters')}else if(!params){callback()}else{callback(params)}}
}

/*
    ON APP START
*/
var selector, currentLight_HadColor;
function startApp(auth){
    $('#toggle i').hide();

    lifx.start(auth, function(data){

        //
        $('#logoutBtn').click(function(){
            localStorage.setItem("lifxAuthKey","");
            window.location.href="login"
        });

        //add lights to dropdown
        $('#select').empty()
        $.each(data, function(i) {
            if(data[i].connected==true){
                $('#select').append('<option value='+data[i].id+' >'+data[i].label+'</option>');
            }
            else{
                $('#select').append('<option disabled>'+data[i].label+' &#x26A0</option>');
            }
        });
        selector = $('#select').val();

        if(!selector){
            alert('oof')
            $('#noLights').fadeIn();
            $('#toggle').prop( "disabled", true );
        }

        //START lightupdating
        $('#toggle i').hide();
        //if first light is already on
        if(data[0].power=='on'){
            $('#on').show();
            $('#off').hide();
        }
        else{
            $('#off').show();
            $('#on').hide();
        }

        //if first light has color capabilities
        currentLight_HadColor = data[0].product.capabilities.has_color;

        $('#kelvin').val(data[0].color.kelvin);
        $('#color').val(data[0].color.hue);


        if(currentLight_HadColor){
            $('#kelvin').fadeIn();
            $('#color').css('opacity', '1')
        }
        else{
            $('#kelvin').fadeIn();
            $('#color').css('opacity', '0')
        }

        //set current background color
        if(data[0].color.saturation==1){
            $('body').css('background','hsla('+data[0].color.hue+', 100%, 50%, 1)');
        }
        else{
            var rgb = colorTemperature2rgb(data[0].color.kelvin);
            $('body').css('background','rgb('+rgb.red+','+rgb.green+','+rgb.blue+')');
        }
        //END lightupdating

        $('footer, main').fadeIn();

    });
}

/*
    EVENT LISTENERS
*/
//on change selector
$('#select').change(function() {
    selector = $('#select').val();
    console.log(selector)
    lifx.get(selector, function(data){
        $('#toggle i').hide();
        //if first light is already on
        if(data[0].power=='on'){
            $('#on').show();
            $('#off').hide();
        }
        else{
            $('#off').show();
            $('#on').hide();
        }

        //if first light has color capabilities
        currentLight_HadColor = data[0].product.capabilities.has_color;

        $('#kelvin').val(data[0].color.kelvin);
        $('#color').val(data[0].color.hue);


        if(currentLight_HadColor){
            $('#kelvin').fadeIn();
            $('#color').css('opacity', '1')
        }
        else{
            $('#kelvin').fadeIn();
            $('#color').css('opacity', '0')
        }

        //set current background color
        if(data[0].color.saturation==1){
            $('body').css('background','hsla('+data[0].color.hue+', 100%, 50%, 1)');
        }
        else{
            var rgb = colorTemperature2rgb(data[0].color.kelvin);
            $('body').css('background','rgb('+rgb.red+','+rgb.green+','+rgb.blue+')');
        }
    })
});

//on click toggle button
$('#toggle').click(function(){
    var isOn = $('#on').is(":visible");
    $('#loader').show(); $('#on,#off').hide();
    lifx.toggle(selector, function(){
        $('#loader').hide();
        if(!isOn){
            $('#on').show();$('#off').hide();
        }
        else{
            $('#off').show();$('#on').hide();
        }
    });
})

//on change kelvin slider
$('#kelvin').change(function() {
    var dataColor = {'color': 'kelvin:'+$('#kelvin').val()}, kelvin = $('#kelvin').val();
    lifx.changeState(selector, dataColor, function(){
        var rgb = colorTemperature2rgb(kelvin);
        $('body').css('background','rgb('+rgb.red+','+rgb.green+','+rgb.blue+')');
    })
});

//on change color slider
$('#color').change(function() {
    console.log(
        'hue:'+$('#color').val()
    )
    var dataColor = {
        'color': 'hue:'+$('#color').val()+' saturation:1.0 brightness:1'
    }
    lifx.changeState(selector, dataColor, function(){
        $('body').css('background','hsla('+$('#color').val()+', 100%, 50%, 1)');
    })
});

/*
    COPY PASTED INTENET SCRIPT 
*/
function colorTemperature2rgb(kelvin) {
    var temperature = kelvin / 100.0;
    var red, green, blue;
    if (temperature < 66.0) {
        red = 255
    } else {
        red = temperature - 55.0;
        red = 351.97690566805693 + 0.114206453784165 * red - 40.25366309332127 * Math.log(red);
        if (red < 0) red = 0;
        if (red > 255) red = 255
    }
    if (temperature < 66.0) {
        green = temperature - 2;
        green = -155.25485562709179 - 0.44596950469579133 * green + 104.49216199393888 * Math.log(green);
        if (green < 0) green = 0;
        if (green > 255) green = 255
    } else {
        green = temperature - 50.0;
        green = 325.4494125711974 + 0.07943456536662342 * green - 28.0852963507957 * Math.log(green);
        if (green < 0) green = 0;
        if (green > 255) green = 255
    }
    if (temperature >= 66.0) {
        blue = 255
    } else {
        if (temperature <= 20.0) {
            blue = 0
        } else {
            blue = temperature - 10;
            blue = -254.76935184120902 + 0.8274096064007395 * blue + 115.67994401066147 * Math.log(blue);
            if (blue < 0) blue = 0;
            if (blue > 255) blue = 255
        }
    }
    return {
        red: Math.round(red),
        green: Math.round(green),
        blue: Math.round(blue)
    }
}
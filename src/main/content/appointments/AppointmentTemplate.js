import React from "react";
import { withStyles } from "@material-ui/core/styles";
import {
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@material-ui/core";
import redlabImage from "../../assets/images/redlab.png";
import redlabLogo from "../../assets/images/redlabLogo.png";

const styles = (theme) => ({
  info: {
    borderRadius: "25px",
    border: "2px solid #000000",
    padding: "20px",
    margin: "1em",
  },
  service: {
    border: "1px solid #000000",
    padding: "5px",
    marginLeft: "2em",
    marginRight: "2em",
    marginBottom: "0.8em",
    textAlign: "center",
  },
  examination: {
    marginLeft: "2em",
    textDecoration: "underline",
  },
  group: {
    marginLeft: "2em",
    paddingTop: "1em",
    textDecoration: "underline",
    fontStyle: "italic",
  },
  spaceLeft: {
    marginLeft: "2em",
  },
  footer: {
    marginTop: "2em",
    marginLeft: "2em",
  },
  td1: {
    border: "2px solid black",
    textAlign: "center",
  },
  td2: {
    textAlign: "right",
    fontSize: "10px",
  },

  td3: {
    textAlign: "center",
    fontSize: "10px",
  },
});

class AppointmentTemplate extends React.Component {
  state = {
    appointment: this.props.appointment,

    loading: true,
  };
  handleClose = () => {
    this.props.onClose();
  };

  render() {
    const { classes } = this.props;
    const { appointment = {} } = this.state;
    console.log(appointment);
    return (
      <div
        style={{
          margin: "2em;",
        }}
        id="print"
      >
        <Grid container spacing={8}>
          <Grid container justify="space-around">
            <Grid item xs={6} />{" "}
            <Grid item xs={6}>
              <img src={redlabLogo} height="70" style={{ float: "right" }} />
            </Grid>
          </Grid>
          <Grid container className={classes.info}>
            <Grid item xs={12} justify="center">
              <h1>Información de la Cita</h1>
            </Grid>
            <Grid item xs={6} justify="center">
              <h3>
                <b>Paciente: </b>
                {appointment.client.name} {appointment.client.lastNameP}{" "}
                {appointment.client.lastNameM}
              </h3>
              <h3>
                <b>Edad: </b>
                {appointment.client.years}
              </h3>
              <h3>
                <b>Sexo: </b>
                {appointment.client.genderStr}
              </h3>
              <h3>
                <b>Dirección de Sede: </b>
                {appointment.headquarter.address}
              </h3>
            </Grid>
            <Grid item xs={6} justify="center">
              <h3>
                <b>Codigo: </b>
                {appointment.code}
              </h3>
              <h3>
                <b>Sede: </b>
                {appointment.headquarter.name}
              </h3>
              <h3>
                <b>Fecha: </b>
                {appointment.dateAppointmentEU}
              </h3>
              <h3>
                <b>Hora: </b>
                {appointment.time12h}
              </h3>
            </Grid>
          </Grid>
          <Grid item xs={12} justify="center">
            {appointment.services.map((serv, serviceIndex) => (
              <table
                key={serviceIndex}
                style={{
                  width: "100%",
                  height: serviceIndex === 0 ? "65vh" : "90vh",
                  paddingTop: serviceIndex === 0 ? "5vh" : "10vh",
                  backgroundImage: `url(${redlabImage})`,
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "90%",
                }}
                className="page-break"
              >
                <thead>
                  <td
                    colSpan="5"
                    style={{ textAlign: "center", border: "2px solid black" }}
                  >
                    {serv.name}
                  </td>
                  <td />
                  <td />
                  <td />
                </thead>
                <tbody>
                  <tr>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                  </tr>
                  <tr>
                    <td />
                    <td className={classes.td1}>RESULTADOS</td>
                    <td className={classes.td1}>UNIDADES</td>
                    <td className={classes.td1}>RANGOS REFERENCIALES</td>
                    <td className={classes.td1}>METODOLOGIA</td>
                  </tr>

                  {serv.result.map(({ examGroup, dataRows }, i) => (
                    <>
                      <tr>
                        <td
                          className={classes.td2}
                          style={{
                            textDecoration: "underline",
                            fontStyle: "italic",
                            fontFamily: "sans-serif",
                            fontWeight: "600",
                          }}
                        >
                          {examGroup}
                        </td>
                        <td />
                        <td />
                        <td />
                      </tr>
                      {dataRows.map((data, j) => (
                        <tr key={j}>
                          <td className={classes.td2}>{data.examValue}</td>
                          <td className={classes.td3}>{data.result} </td>
                          <td className={classes.td3}>{data.unit}</td>
                          <td className={classes.td3}>{data.refValue}</td>
                          <td className={classes.td3}>{data.method}</td>
                        </tr>
                      ))}
                    </>
                  ))}
                  {serviceIndex === appointment.services.length - 1 && (
                    <>
                      <tr>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                      </tr>
                      <tr>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                      </tr>
                      <tr>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>
                          <img
                            src={appointment.digitalSignatureUrl}
                            height="70"
                            style={{ float: "right" }}
                          />
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            ))}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                paddingRight: "30px",
                paddingLeft: "30px",
              }}
            >
              <div>Adresss: 23, location peru</div>
              <div>Email: myemail@email.com</div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                paddingRight: "30px",
                paddingLeft: "30px",
              }}
            >
              <div>Phone: 043949434834</div>
              <div>website: www.website.com</div>
            </div>
            <div>
              <img src={redlabLogo} height="70" style={{ float: "right" }} />
            </div>
          </Grid>
        </Grid>
      </div>
    );
  }
}

export default withStyles(styles)(AppointmentTemplate);
